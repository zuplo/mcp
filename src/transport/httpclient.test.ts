import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import type { JSONRPCRequest } from "../jsonrpc2/types.js";
import { HTTPClientTransport } from "./httpclient.js";

// Mock fetch function
const createMockFetch = (
  responseBody: string,
  contentType = "application/json",
  status = 200
) => {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get: (key: string) => {
        if (key === "Content-Type") return contentType;
        return null;
      },
    },
    text: () => Promise.resolve(responseBody),
    body: contentType.includes("text/event-stream")
      ? createReadableStream([responseBody])
      : null,
  });
};

function createReadableStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    start(controller) {
      function pump() {
        if (index >= chunks.length) {
          controller.close();
          return;
        }

        controller.enqueue(encoder.encode(chunks[index]));
        index++;

        setTimeout(pump, 10);
      }
      pump();
    },
  });
}

describe("HTTPClientTransport", () => {
  let transport: HTTPClientTransport;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = createMockFetch(
      '{"result":{"tools":[]},"jsonrpc":"2.0","id":1}'
    );

    transport = new HTTPClientTransport({
      url: "https://example.com/mcp",
      fetch: mockFetch,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("JSON Response Handling", () => {
    it("should handle JSON response correctly", async () => {
      const mockHandler = jest.fn();
      transport.onMessage(mockHandler);

      await transport.connect();

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      };

      await transport.send(request);

      expect(mockFetch).toHaveBeenCalledWith("https://example.com/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(request),
        signal: expect.any(AbortSignal),
      });

      expect(mockHandler).toHaveBeenCalledWith({
        result: { tools: [] },
        jsonrpc: "2.0",
        id: 1,
      });
    });
  });

  describe("SSE Response Handling", () => {
    it("should handle SSE response with message events", async () => {
      const sseResponse = `event: message
data: {"result":{"tools":[{"name":"search"}]},"jsonrpc":"2.0","id":1}

`;

      mockFetch = createMockFetch(sseResponse, "text/event-stream");
      transport = new HTTPClientTransport({
        url: "https://example.com/mcp",
        fetch: mockFetch,
      });

      const mockHandler = jest.fn();
      transport.onMessage(mockHandler);

      await transport.connect();

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      };

      await transport.send(request);

      // Give time for async stream processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockHandler).toHaveBeenCalledWith({
        result: { tools: [{ name: "search" }] },
        jsonrpc: "2.0",
        id: 1,
      });
    });

    it("should handle multiple messages in SSE stream", async () => {
      const sseResponse = `event: message
data: {"method":"notifications/message","params":{"level":"info","message":"Starting"},"jsonrpc":"2.0"}

event: message
data: {"result":{"tools":[]},"jsonrpc":"2.0","id":1}

`;

      mockFetch = createMockFetch(sseResponse, "text/event-stream");
      transport = new HTTPClientTransport({
        url: "https://example.com/mcp",
        fetch: mockFetch,
      });

      const mockHandler = jest.fn();
      transport.onMessage(mockHandler);

      await transport.connect();

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      };

      await transport.send(request);

      // Give time for async stream processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockHandler).toHaveBeenCalledTimes(2);
      expect(mockHandler).toHaveBeenNthCalledWith(1, {
        method: "notifications/message",
        params: { level: "info", message: "Starting" },
        jsonrpc: "2.0",
      });
      expect(mockHandler).toHaveBeenNthCalledWith(2, {
        result: { tools: [] },
        jsonrpc: "2.0",
        id: 1,
      });
    });

    it("should ignore non-message events", async () => {
      const sseResponse = `event: ping
data: heartbeat

event: message
data: {"result":{"tools":[]},"jsonrpc":"2.0","id":1}

`;

      mockFetch = createMockFetch(sseResponse, "text/event-stream");
      transport = new HTTPClientTransport({
        url: "https://example.com/mcp",
        fetch: mockFetch,
      });

      const mockHandler = jest.fn();
      transport.onMessage(mockHandler);

      await transport.connect();

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
      };

      await transport.send(request);

      // Give time for async stream processing
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should only get the message event, not the ping
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(mockHandler).toHaveBeenCalledWith({
        result: { tools: [] },
        jsonrpc: "2.0",
        id: 1,
      });
    });
  });

  describe("Session Management", () => {
    it("should include session ID in request headers", async () => {
      transport.setSessionId("session-123");

      await transport.connect();

      const request: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "ping",
      };

      await transport.send(request);

      expect(mockFetch).toHaveBeenCalledWith("https://example.com/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "Mcp-Session-Id": "session-123",
        },
        body: JSON.stringify(request),
        signal: expect.any(AbortSignal),
      });
    });
  });
});
