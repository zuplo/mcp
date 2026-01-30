import { beforeEach, describe, expect, it } from "@jest/globals";
import type { JSONRPCMessage } from "../jsonrpc2/types.js";
import { newJSONRPCReponse } from "../jsonrpc2/types.js";
import type { JSONRPCResponse } from "../jsonrpc2/types.js";
import type {
  CallToolResult,
  GetPromptResult,
  InitializeResult,
  ListPromptsResult,
  ListToolsResult,
} from "../mcp/20250618/types.js";
import type { Transport } from "../transport/types.js";
import { MCPClient } from "./index.js";

// Mock transport for testing
class MockTransport implements Transport {
  private messageHandler?: (
    message: JSONRPCMessage
  ) => Promise<JSONRPCMessage | null>;

  async connect(): Promise<void> {}

  setHeaders(_headers: Record<string, string>): void {}

  async send(message: JSONRPCMessage): Promise<void> {
    // Simulate response based on method
    if ("method" in message && "id" in message) {
      const id = message.id as number;
      let response: JSONRPCResponse;

      switch (message.method) {
        case "notifications/initialized":
          // This is a notification, no response expected
          return;

        case "initialize":
          response = newJSONRPCReponse({
            id,
            result: {
              protocolVersion: "2025-03-26",
              capabilities: {
                tools: { supported: true, available: [] },
                prompts: {},
              },
              serverInfo: {
                name: "Test Server",
                version: "1.0.0",
              },
            } as InitializeResult,
          });
          break;

        case "ping":
          response = newJSONRPCReponse({ id, result: {} });
          break;

        case "tools/list":
          response = newJSONRPCReponse({
            id,
            result: {
              tools: [
                {
                  name: "test_tool",
                  description: "A test tool",
                  inputSchema: {
                    type: "object",
                    properties: {
                      input: { type: "string" },
                    },
                  },
                },
              ],
            } as ListToolsResult,
          });
          break;

        case "tools/call":
          response = newJSONRPCReponse({
            id,
            result: {
              content: [{ type: "text", text: "Tool executed successfully" }],
              isError: false,
            } as CallToolResult,
          });
          break;

        case "prompts/list":
          response = newJSONRPCReponse({
            id,
            result: {
              prompts: [
                {
                  name: "test_prompt",
                  description: "A test prompt",
                },
              ],
            } as ListPromptsResult,
          });
          break;

        case "prompts/get":
          response = newJSONRPCReponse({
            id,
            result: {
              description: "Test prompt result",
              messages: [
                {
                  role: "user",
                  content: {
                    type: "text",
                    text: "Test prompt message",
                  },
                },
              ],
            } as GetPromptResult,
          });
          break;

        default:
          throw new Error(`Unhandled method: ${message.method}`);
      }

      // Simulate async response
      setTimeout(() => {
        this.messageHandler?.(response);
      }, 0);
    }
  }

  onMessage(
    handler: (message: JSONRPCMessage) => Promise<JSONRPCMessage | null>
  ): void {
    this.messageHandler = handler;
  }

  async close(): Promise<void> {}

  onError(_callback: (error: Error) => void): void {}

  getSessionId(): string | undefined {
    return undefined;
  }

  setSessionId(_sessionId: string | undefined): void {}
}

describe("MCPClient", () => {
  let client: MCPClient;
  let mockTransport: MockTransport;

  beforeEach(() => {
    client = new MCPClient({
      name: "Test Client",
      version: "1.0.0",
    });
    mockTransport = new MockTransport();
  });

  describe("Construction and Configuration", () => {
    it("should create client with default options", () => {
      const defaultClient = new MCPClient();

      expect(defaultClient.name).toBe("MCP Client");
      expect(defaultClient.version).toBe("0.0.0");
    });

    it("should create client with custom options", () => {
      expect(client.name).toBe("Test Client");
      expect(client.version).toBe("1.0.0");
    });
  });

  describe("Connection Management", () => {
    it("should initialize connection", async () => {
      await client.connect(mockTransport);
      const result = await client.initialize();

      expect(result.protocolVersion).toBe("2025-03-26");
      expect(result.serverInfo.name).toBe("Test Server");
    });

    it("should disconnect", async () => {
      await client.connect(mockTransport);
      await client.initialize();
      await client.disconnect();
      await expect(client.ping()).rejects.toThrow("Client not initialized");
    });

    it("should throw error when calling methods without initialization", async () => {
      await client.connect(mockTransport);

      await expect(client.ping()).rejects.toThrow("Client not initialized");
      await expect(client.listTools()).rejects.toThrow(
        "Client not initialized"
      );
      await expect(client.callTool("test")).rejects.toThrow(
        "Client not initialized"
      );
    });
  });

  describe("Tool Operations", () => {
    beforeEach(async () => {
      await client.connect(mockTransport);
      await client.initialize();
    });

    it("should ping server", async () => {
      await expect(client.ping()).resolves.not.toThrow();
    });

    it("should list tools", async () => {
      const tools = await client.listTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("test_tool");
      expect(tools[0].description).toBe("A test tool");
    });

    it("should call tool", async () => {
      const result = await client.callTool("test_tool", { input: "test" });

      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe("text");
      expect(result.content[0].text).toBe("Tool executed successfully");
      expect(result.isError).toBe(false);
    });
  });

  describe("Prompt Operations", () => {
    beforeEach(async () => {
      await client.connect(mockTransport);
      await client.initialize();
    });

    it("should list prompts", async () => {
      const prompts = await client.listPrompts();

      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts).toHaveLength(1);
      expect(prompts[0].name).toBe("test_prompt");
      expect(prompts[0].description).toBe("A test prompt");
    });

    it("should get prompt", async () => {
      const result = await client.getPrompt("test_prompt", { input: "test" });

      expect(result.description).toBe("Test prompt result");
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe("user");
    });
  });
});
