import { type ZodSchema, z } from "zod";
import zodToJsonSchema from "zod-to-json-schema";
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
import { CallToolRequestSchema } from "../mcp/20250326/types/schemas/tools.schema.js";
import type {
  CallToolResult,
  InitializeResult,
  ListToolsResult,
  ServerCapabilities,
  Tool,
} from "../mcp/20250326/types/types.js";
import { LATEST_PROTOCOL_VERSION } from "../mcp/versions.js";
import type { Transport } from "../transport/types.js";
import type { MCPServerOptions, RegisteredTool, ToolConfig } from "./types.js";

export class MCPServer {
  private capabilities: ServerCapabilities;
  private tools: Map<string, RegisteredTool> = new Map();
  private name: string;
  private version: string;
  private instructions: string | undefined;

  constructor(options: MCPServerOptions) {
    this.name = options.name || "MCP Server";
    this.version = options.version || "1.0.0";
    this.instructions = options.instructions || undefined;

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
          console.log("Received response:", message);
          return null;
        }
      } catch (error) {
        console.error("Error processing message:", error);

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
    S extends ZodSchema = ZodSchema,
    R extends CallToolResult = CallToolResult,
  >(config: ToolConfig<S, R>): void {
    const {
      name,
      schema,
      handler,
      description = `Execute the ${name} tool`,
    } = config;

    // Create tool schema from zod schema
    const toolSchema: Tool = {
      name,
      description,
      inputSchema: zodToJsonSchema(schema) as Tool["inputSchema"],
    };

    const registeredTool: RegisteredTool = {
      toolSchema: toolSchema,
      inputSchema: schema,
      handler,
    };

    this.tools.set(name, registeredTool);
    this.updateAvailableTools();

    return;
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
    return Array.from(this.tools.values()).map((tool) => tool.toolSchema);
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
      console.error("Error handling request:", error);

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
    console.log("received notification", notification.method);
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
  private handleInitialize(request: JSONRPCRequest): JSONRPCResponse {
    const initResponse: InitializeResult = {
      protocolVersion: LATEST_PROTOCOL_VERSION,
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

  private async handleToolListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    // Map over the tools Map to create an array of Tool objects
    const toolsArray = Array.from(this.tools.entries()).map(
      ([name, registeredTool]) => {
        // Extract the toolSchema which already has the correct structure
        return registeredTool.toolSchema;
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
      console.log("could not validate tool call with calltoolrequestschema");
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

    // Validate parameters if schema is available
    const params = toolCallReq.params.arguments || {};
    let validatedParams = z.object({});

    if (tool.inputSchema) {
      const parsed = tool.inputSchema.safeParse(params);
      if (!parsed.success) {
        return {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32602,
            message: "Invalid params",
            data: parsed.error,
          },
        };
      }

      validatedParams = parsed.data;
    }

    // Execute the tool
    try {
      const result = await tool.handler(validatedParams);

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: result,
      };
    } catch (error) {
      console.error(`Error executing tool "${toolName}":`, error);

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
