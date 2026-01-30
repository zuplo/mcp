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
} from "../mcp/20251125/types.js";
import { LATEST_PROTOCOL_VERSION } from "../mcp/versions.js";
import type { Transport, TransportOptions } from "../transport/types.js";
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
  private requestId = 0;
  private transportOptions: TransportOptions;
  private pendingRequests = new Map<
    number | string,
    {
      resolve: (value: JSONRPCResponse | JSONRPCError) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor(options: MCPClientOptions = {}) {
    this.name = options.name || DEFAULT_MCP_CLIENT_NAME;
    this.version = options.version || DEFAULT_MCP_CLIENT_VERSION;
    this.logger = options.logger || createDefaultLogger();
    this.transportOptions = options.transportOptions || {};
    this.capabilities = {
      sampling: {},
      ...options.capabilities,
    };
  }

  /**
   * Connect to an MCP server using the provided transport
   */
  public async connect(transport: Transport): Promise<void> {
    if (this.transportOptions.headers) {
      transport.setHeaders(this.transportOptions.headers);
    }
    this.transport = transport;

    // Set up a single, stable message handler that routes responses to pending requests
    this.transport.onMessage(async (message) => {
      if (
        (isJSONRPCResponse(message) || isJSONRPCError(message)) &&
        message.id !== undefined &&
        message.id !== null
      ) {
        const pending = this.pendingRequests.get(message.id);
        if (pending) {
          this.pendingRequests.delete(message.id);
          pending.resolve(message);
        }
      }
      return null;
    });

    await transport.connect();
  }

  /**
   * Initialize the connection with the server
   * This conforms to https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#initialization
   */
  public async initialize(
    protocolVersion = LATEST_PROTOCOL_VERSION
  ): Promise<InitializeResult> {
    if (!this.transport) {
      throw new Error("No transport connected. Call connect() first.");
    }

    // 1. Send initialize request
    const initializeRequest = newJSONRPCRequest({
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

    const initializeResponse = await this.sendRequest(initializeRequest);

    if (isJSONRPCError(initializeResponse)) {
      throw new Error(`Initialization failed: ${initializeResponse.error.message}`);
    }

    // 2. Send notifications/initialized message (notification - no response expected)
    const initializedNotification = newJSONRPCRequest({
      id: this.requestId,
      method: "notifications/initialized"
    });
    this.sendNotification(initializedNotification);

    const result = initializeResponse.result as InitializeResult;
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
      // Add request to pending map before sending
      this.pendingRequests.set(request.id, { resolve, reject });
      this.logger.debug(`sendRequest: ${JSON.stringify(request)} with id ${request.id}`);

      this.transport?.send(request).catch((err) => {
        this.pendingRequests.delete(request.id);
        reject(err);
      });

      this.requestId++;
    });
  }

  private sendNotification(request: JSONRPCRequest): void {
    // Fire and forget - notifications don't expect responses per JSON-RPC spec
    // Don't await since SSE streams may stay open
    this.transport?.send(request).catch((err) => {
      this.logger.warn("Notification send error:", err);
    });
    this.requestId++;
  }
}
