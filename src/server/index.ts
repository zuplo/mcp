import { z } from "zod/v4";
import type {
  JSONRPCError,
  JSONRPCMessage,
  JSONRPCNotification,
  JSONRPCRequest,
  JSONRPCResponse,
} from "../jsonrpc2/types.js";
import {
  isJSONRPCNotification,
  isJSONRPCRequest,
  isJSONRPCResponse,
} from "../jsonrpc2/validation.js";
import { createDefaultLogger } from "../logger/index.js";
import type { Logger } from "../logger/types.js";
import { InitializeRequestSchema } from "../mcp/20250618/schemas/initialize.schema.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "../mcp/20250618/schemas/prompt.schema.js";
import { CallToolRequestSchema } from "../mcp/20250618/schemas/tools.schema.js";
import type {
  CallToolResult,
  GetPromptResult,
  InitializeResult,
  ListPromptsResult,
  ListToolsResult,
  Prompt,
  ServerCapabilities,
  Tool,
} from "../mcp/20250618/types.js";
import {
  LATEST_PROTOCOL_VERSION,
  PROTOCOL_VERSION_2024_10_07,
  PROTOCOL_VERSION_2024_11_05,
  PROTOCOL_VERSION_2025_03_26,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "../mcp/versions.js";
import type { PromptConfig, RegisteredPrompt } from "../prompts/types.js";
import type { ToolConfig } from "../tools/types.js";
import type { Transport } from "../transport/types.js";
import type {
  InputParamValidator,
  MCPServerOptions,
  RegisteredTool,
} from "./types.js";

export const DEFAULT_MCP_SERVER_NAME = "MCP Server";
export const DEFAULT_MCP_SERVER_VERSION = "0.0.0";

export class MCPServer {
  private capabilities: ServerCapabilities;
  private tools: Map<string, RegisteredTool> = new Map();
  private prompts: Map<string, RegisteredPrompt> = new Map();
  private name: string;
  private version: string;
  private instructions: string | undefined;
  private logger: Logger;

  constructor(options: MCPServerOptions) {
    this.name = options.name || DEFAULT_MCP_SERVER_NAME;
    this.version = options.version || DEFAULT_MCP_SERVER_VERSION;
    this.instructions = options.instructions || undefined;
    this.logger = options.logger || createDefaultLogger();

    // Set default capabilities
    this.capabilities = {
      tools: {
        supported: true,
        available: [],
      },
      prompts: {},
      ...options.capabilities,
    };
  }

  public withTransport(transport: Transport) {
    transport.onMessage(async (message): Promise<JSONRPCMessage | null> => {
      try {
        if (isJSONRPCRequest(message)) {
          const response = await this.handleRequest(message);
          if (response) {
            await transport.send(response);
            return response;
          }
        } else if (isJSONRPCNotification(message)) {
          await this.handleNotification(message);
          return null;
        } else if (isJSONRPCResponse(message)) {
          this.logger.debug("Received response:", message);
          return null;
        }
      } catch (error) {
        this.logger.error("Error processing message:", error);

        // Send error response for requests
        if (isJSONRPCRequest(message)) {
          const errorResponse: JSONRPCError = {
            jsonrpc: "2.0",
            id: message.id,
            error: {
              code: -32603,
              message:
                error instanceof Error ? error.message : "Internal error",
            },
          };

          await transport.send(errorResponse);
          return errorResponse;
        }
      }

      return null;
    });
  }

  getTool(name: string): Tool | undefined {
    const registeredTool = this.tools.get(name);
    return registeredTool?.tool;
  }

  getTools(): Map<string, Tool> {
    const toolsMap = new Map<string, Tool>();
    for (const [name, registeredTool] of this.tools.entries()) {
      toolsMap.set(name, registeredTool.tool);
    }
    return toolsMap;
  }

  /**
   * Get the server capabilities
   */
  public getCapabilities(): ServerCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Register a tool
   */
  public addTool<
    V extends InputParamValidator<unknown>,
    R extends CallToolResult = CallToolResult,
  >(config: ToolConfig<V, R>): void {
    const {
      name,
      validator,
      handler,
      description = `Execute the ${name} tool`,
      outputSchema,
    } = config;

    const toolSchema: Tool = {
      name,
      description,
      inputSchema: validator.jsonSchema as Tool["inputSchema"],
      ...(outputSchema && { outputSchema }),
    };

    const registered: RegisteredTool = {
      tool: toolSchema,
      validator,
      handler,
    };

    this.tools.set(name, registered);
    this.updateAvailableTools();
  }

  /**
   * Remove a tool from the server
   */
  public removeTool(name: string): boolean {
    const result = this.tools.delete(name);

    if (result) {
      this.updateAvailableTools();
    }

    return result;
  }

  /**
   * Get all registered tools
   */
  public getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => tool.tool);
  }

  /**
   * Register a prompt
   */
  public addPrompt<V extends InputParamValidator<unknown>>(
    config: PromptConfig<V>
  ): void {
    const {
      name,
      validator,
      generator,
      description,
      arguments: promptArguments,
      _meta,
    } = config;

    const promptSchema: Prompt = {
      name,
      ...(description && { description }),
      ...(promptArguments && { arguments: promptArguments }),
      ...(_meta && { _meta }),
    };

    const registered: RegisteredPrompt = {
      prompt: promptSchema,
      validator,
      generator,
    };

    this.prompts.set(name, registered);
  }

  /**
   * Remove a prompt from the server
   */
  public removePrompt(name: string): boolean {
    return this.prompts.delete(name);
  }

  /**
   * Get a specific prompt by name
   */
  public getPrompt(name: string): Prompt | undefined {
    const registeredPrompt = this.prompts.get(name);
    return registeredPrompt?.prompt;
  }

  /**
   * Get all registered prompts
   */
  public getPromptDefinitions(): Prompt[] {
    return Array.from(this.prompts.values()).map((prompt) => prompt.prompt);
  }

  /**
   * Handle a JSON-RPC request
   */
  public async handleRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    try {
      switch (request.method) {
        case "ping":
          return this.handlePing(request);
        case "initialize":
          return this.handleInitialize(request);
        case "tools/list":
          return this.handleToolListRequest(request);
        case "tools/call":
          return this.handleToolCallRequest(request);
        case "prompts/list":
          return this.handlePromptListRequest(request);
        case "prompts/get":
          return this.handlePromptGetRequest(request);
        default:
          // Method not found
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: {
              code: -32601,
              message: `Method "${request.method}" not found`,
            },
          };
      }
    } catch (error) {
      this.logger.error("Error handling request:", error);

      // Internal error
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : "Internal error",
        },
      };
    }
  }

  /**
   * Handle a JSON-RPC notification
   */
  public async handleNotification(
    notification: JSONRPCNotification
  ): Promise<void> {
    this.logger.debug("Received notification:", notification.method);
  }

  /**
   * Handle ping request - the server MUST respond with an empty request.
   */
  private handlePing(request: JSONRPCRequest): JSONRPCResponse | JSONRPCError {
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: {},
    };
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(
    request: JSONRPCRequest
  ): JSONRPCResponse | JSONRPCError {
    const parseResult = InitializeRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: `Invalid request parameters: ${prettyErrors}`,
          data: treeErrors,
        },
      };
    }

    const protocolVersion = parseResult.data.params.protocolVersion;

    switch (protocolVersion) {
      case LATEST_PROTOCOL_VERSION:
      case PROTOCOL_VERSION_2025_03_26:
      case PROTOCOL_VERSION_2024_11_05:
      case PROTOCOL_VERSION_2024_10_07: {
        const initResponse: InitializeResult = {
          protocolVersion: protocolVersion,
          capabilities: this.getCapabilities(),
          serverInfo: {
            name: this.name,
            version: this.version,
          },
          ...(this.instructions ? { instructions: this.instructions } : {}),
        };

        return {
          jsonrpc: "2.0",
          id: request.id,
          result: initResponse,
        };
      }
      default: {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: `Unsupported protocol version: ${protocolVersion} - supported versions: ${SUPPORTED_PROTOCOL_VERSIONS}`,
            data: {
              supportedVersions: SUPPORTED_PROTOCOL_VERSIONS,
            },
          },
        };
      }
    }
  }

  private async handleToolListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    // Map over the tools Map to create an array of Tool objects
    const toolsArray = Array.from(this.tools.entries()).map(
      ([name, registeredTool]) => {
        // Extract the toolSchema which already has the correct structure
        return registeredTool.tool;
      }
    );

    const toolList: ListToolsResult = {
      tools: toolsArray,
    };

    return {
      jsonrpc: "2.0",
      id: request.id,
      result: toolList,
    };
  }

  /**
   * Handle tool request
   */
  private async handleToolCallRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const validatedToolCall = CallToolRequestSchema.safeParse(request);
    if (!validatedToolCall.success) {
      this.logger.warn(
        "Could not validate tool call:",
        validatedToolCall.error
      );
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32600,
          message: `Invalid request ${validatedToolCall.error}`,
        },
      };
    }

    const toolCallReq = validatedToolCall.data;
    const toolName = toolCallReq.params.name;

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32601,
          message: `Tool "${toolName}" not found`,
        },
      };
    }

    const rawArgs = toolCallReq.params.arguments ?? {};
    const validation = tool.validator.parse(rawArgs);
    if (!validation.success) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: validation.errorMessage
            ? `Invalid arguments for tool '${toolName}': ${validation.errorMessage}`
            : `Invalid arguments for tool '${toolName}'`,
          data: validation.errorData,
        },
      };
    }

    // Execute the tool
    try {
      // upcast here since we are sure that the json schema object has been
      // validated and "data" should be some sort of object.
      const data = validation.data as object;
      const result = await tool.handler(data);

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: result,
      };
    } catch (error) {
      this.logger.error(`Error executing tool "${toolName}":`, error);

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message:
            error instanceof Error ? error.message : "Tool execution error",
        },
      };
    }
  }

  /**
   * Handle prompts/list request
   */
  private async handlePromptListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = ListPromptsRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: `Invalid request parameters: ${prettyErrors}`,
          data: treeErrors,
        },
      };
    }

    const promptsArray = Array.from(this.prompts.values()).map(
      (registeredPrompt) => registeredPrompt.prompt
    );

    const result: ListPromptsResult = {
      prompts: promptsArray,
    };

    return {
      jsonrpc: "2.0",
      id: request.id,
      result,
    };
  }

  /**
   * Handle prompts/get request
   */
  private async handlePromptGetRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = GetPromptRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: `Invalid request parameters: ${prettyErrors}`,
          data: treeErrors,
        },
      };
    }

    const promptName = parseResult.data.params.name;
    const prompt = this.prompts.get(promptName);

    if (!prompt) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: `Prompt "${promptName}" not found`,
        },
      };
    }

    const rawArgs = parseResult.data.params.arguments ?? {};
    const validation = prompt.validator.parse(rawArgs);

    if (!validation.success) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32602,
          message: validation.errorMessage
            ? `Invalid arguments for prompt '${promptName}': ${validation.errorMessage}`
            : `Invalid arguments for prompt '${promptName}'`,
          data: validation.errorData,
        },
      };
    }

    try {
      const data = validation.data as object;
      const messages = await prompt.generator(data);

      const result: GetPromptResult = {
        ...(prompt.prompt.description && {
          description: prompt.prompt.description,
        }),
        messages,
      };

      return {
        jsonrpc: "2.0",
        id: request.id,
        result,
      };
    } catch (error) {
      this.logger.error(`Error generating prompt "${promptName}":`, error);

      return {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32603,
          message:
            error instanceof Error ? error.message : "Prompt generation error",
        },
      };
    }
  }

  /**
   * Update the available tools in capabilities
   */
  private updateAvailableTools(): void {
    if (this.capabilities.tools) {
      this.capabilities.tools.available = Array.from(this.tools.keys());
    }
  }
}
