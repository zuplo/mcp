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
import { InitializeRequestSchema } from "../mcp/20250618/types/schemas/initialize.schema.js";
import { CallToolRequestSchema } from "../mcp/20250618/types/schemas/tools.schema.js";
import type {
  CallToolResult,
  InitializeResult,
  ListToolsResult,
  ServerCapabilities,
  Tool,
} from "../mcp/20250618/types/types.js";
import {
  LATEST_PROTOCOL_VERSION,
  PROTOCOL_VERSION_2024_10_07,
  PROTOCOL_VERSION_2024_11_05,
  PROTOCOL_VERSION_2025_03_26,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "../mcp/versions.js";
import type { ToolConfig } from "../tools/types.js";
import type { Transport } from "../transport/types.js";
import type {
  InputParamValidator,
  MCPServerOptions,
  RegisteredTool,
} from "./types.js";

export class MCPServer {
  private capabilities: ServerCapabilities;
  private tools: Map<string, RegisteredTool> = new Map();
  private name: string;
  private version: string;
  private instructions: string | undefined;
  private logger: Logger;

  constructor(options: MCPServerOptions) {
    this.name = options.name || "MCP Server";
    this.version = options.version || "1.0.0";
    this.instructions = options.instructions || undefined;
    this.logger = options.logger || createDefaultLogger();

    // Set default capabilities
    this.capabilities = {
      tools: {
        supported: true,
        available: [],
      },
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
    throw new Error("Method not implemented.");
  }

  getTools(): Map<string, Tool> {
    throw new Error("Method not implemented.");
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
   * Update the available tools in capabilities
   */
  private updateAvailableTools(): void {
    if (this.capabilities.tools) {
      this.capabilities.tools.available = Array.from(this.tools.keys());
    }
  }
}
