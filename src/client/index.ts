import type {
  JSONRPCError,
  JSONRPCRequest,
  JSONRPCResponse,
} from "../jsonrpc2/types.js";
import { newJSONRPCRequest } from "../jsonrpc2/types.js";
import { isJSONRPCError, isJSONRPCResponse } from "../jsonrpc2/validation.js";
import { createDefaultLogger } from "../logger/index.js";
import type { Logger } from "../logger/types.js";
import type {
  CallToolResult,
  ClientCapabilities,
  GetPromptResult,
  InitializeResult,
  ListPromptsResult,
  ListToolsResult,
  Prompt,
  Tool,
} from "../mcp/20250618/types.js";
import { LATEST_PROTOCOL_VERSION } from "../mcp/versions.js";
import type { Transport } from "../transport/types.js";
import type { MCPClientOptions } from "./types.js";

export const DEFAULT_MCP_CLIENT_NAME = "MCP Client";
export const DEFAULT_MCP_CLIENT_VERSION = "0.0.0";

export class MCPClient {
  readonly name: string;
  readonly version: string;
  readonly capabilities: ClientCapabilities;

  private transport?: Transport;
  private isInitialized = false;
  private protocolVersion?: string;
  private logger: Logger;
  private requestId = 1;

  constructor(options: MCPClientOptions = {}) {
    this.name = options.name || DEFAULT_MCP_CLIENT_NAME;
    this.version = options.version || DEFAULT_MCP_CLIENT_VERSION;
    this.logger = options.logger || createDefaultLogger();
    this.capabilities = {
      experimental: {},
      sampling: {},
      ...options.capabilities,
    };
  }

  /**
   * Connect to an MCP server using the provided transport
   */
  public async connect(transport: Transport): Promise<void> {
    this.transport = transport;
    await transport.connect();
  }

  /**
   * Initialize the connection with the server
   */
  public async initialize(
    protocolVersion = LATEST_PROTOCOL_VERSION
  ): Promise<InitializeResult> {
    if (!this.transport) {
      throw new Error("No transport connected. Call connect() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "initialize",
      params: {
        protocolVersion,
        capabilities: this.capabilities,
        clientInfo: {
          name: this.name,
          version: this.version,
        },
      },
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(`Initialization failed: ${response.error.message}`);
    }

    const result = response.result as InitializeResult;
    this.isInitialized = true;
    this.protocolVersion = result.protocolVersion;

    this.logger.info("Successfully initialized MCP client", {
      serverInfo: result,
      protocolVersion: this.protocolVersion,
    });

    return result;
  }

  /**
   * Send a ping request to the server
   */
  public async ping(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "ping",
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(`Ping failed: ${response.error.message}`);
    }
  }

  /**
   * List all available tools from the server
   */
  public async listTools(): Promise<Tool[]> {
    if (!this.isInitialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "tools/list",
      params: {},
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(`Failed to list tools: ${response.error.message}`);
    }

    const result = response.result as ListToolsResult;
    return result.tools;
  }

  /**
   * Call a specific tool with provided arguments
   */
  public async callTool(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<CallToolResult> {
    if (!this.isInitialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(
        `Failed to call tool '${name}': ${response.error.message}`
      );
    }

    return response.result as CallToolResult;
  }

  /**
   * List all available prompts from the server
   */
  public async listPrompts(): Promise<Prompt[]> {
    if (!this.isInitialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "prompts/list",
      params: {},
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(`Failed to list prompts: ${response.error.message}`);
    }

    const result = response.result as ListPromptsResult;
    return result.prompts;
  }

  /**
   * Get a prompt with provided arguments
   */
  public async getPrompt(
    name: string,
    args: Record<string, unknown> = {}
  ): Promise<GetPromptResult> {
    if (!this.isInitialized) {
      throw new Error("Client not initialized. Call initialize() first.");
    }

    const request = newJSONRPCRequest({
      id: this.requestId,
      method: "prompts/get",
      params: {
        name,
        arguments: args,
      },
    });

    const response = await this.sendRequest(request);

    if (isJSONRPCError(response)) {
      throw new Error(
        `Failed to get prompt '${name}': ${response.error.message}`
      );
    }

    return response.result as GetPromptResult;
  }

  /**
   * Disconnect from the server
   */
  public async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.close();
      this.transport = undefined;
    }

    this.isInitialized = false;
    this.protocolVersion = undefined;
  }

  private async sendRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    return new Promise((resolve, reject) => {
      const requestId = request.id;

      // Set up a temporary message handler to capture the response
      this.transport?.onMessage(async (message) => {
        // Check if this is the response we're waiting for
        if (
          (isJSONRPCResponse(message) || isJSONRPCError(message)) &&
          message.id === requestId
        ) {
          resolve(message);
          return null;
        }

        return null;
      });

      // Send the request
      this.transport?.send(request).catch(reject);
    });
  }
}
