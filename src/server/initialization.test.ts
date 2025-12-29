import { newJSONRPCRequest } from "../jsonrpc2/types.js";
import type { InitializeResult } from "../mcp/20251125/types.js";
import {
  LATEST_PROTOCOL_VERSION,
  PROTOCOL_VERSION_2025_03_26,
} from "../mcp/versions.js";
import { MCPServer } from "./index.js";

describe("MCPServer", () => {
  describe("initialize", () => {
    it("properly handles initialization request", async () => {
      const serverName = "example ping server";
      const serverVersion = "0.0.0";
      const server = new MCPServer({
        name: serverName,
        version: serverVersion,
      });

      const clientReq = newJSONRPCRequest({
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: LATEST_PROTOCOL_VERSION,
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true,
            },
          },
          clientInfo: {
            name: "mcp-client",
            version: "0.0.0",
          },
        },
      });

      const response = await server.handleRequest(clientReq);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(0);

      if ("result" in response) {
        const result = response.result as InitializeResult;

        // Verify protocol version matches the latest
        expect(result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION);

        // Verify capabilities are correctly included
        expect(result.capabilities).toEqual({
          tools: {
            supported: true,
            available: [],
          },
          prompts: {},
          resources: {},
        });

        // Verify server info is correctly included
        expect(result.serverInfo).toEqual({
          name: serverName,
          version: serverVersion,
        });
      } else {
        fail("Expected a result, got an error response with no result");
      }
    });

    it("handles initialization with older version of protocol", async () => {
      const serverName = "example ping server";
      const serverVersion = "0.0.0";
      const server = new MCPServer({
        name: serverName,
        version: serverVersion,
      });

      const clientReq = newJSONRPCRequest({
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: PROTOCOL_VERSION_2025_03_26,
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true,
            },
          },
          clientInfo: {
            name: "mcp-client",
            version: "0.0.0",
          },
        },
      });

      const response = await server.handleRequest(clientReq);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(0);

      if ("result" in response) {
        const result = response.result as InitializeResult;

        // Verify protocol version matches the latest
        expect(result.protocolVersion).toBe(PROTOCOL_VERSION_2025_03_26);

        // Verify capabilities are correctly included
        expect(result.capabilities).toEqual({
          tools: {
            supported: true,
            available: [],
          },
          prompts: {},
          resources: {},
        });

        // Verify server info is correctly included
        expect(result.serverInfo).toEqual({
          name: serverName,
          version: serverVersion,
        });
      } else {
        fail("Expected a result, got an error response with no result");
      }
    });

    it("handles missing protocolVersion in initialization message", async () => {
      // should get an error JSON RPC 2 message if protocolVersion is missing
      const serverName = "example ping server";
      const serverVersion = "0.0.0";
      const server = new MCPServer({
        name: serverName,
        version: serverVersion,
      });

      const clientReq = newJSONRPCRequest({
        id: 0,
        method: "initialize",
        params: {
          // protocolVersion is intentionally missing
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true,
            },
          },
          clientInfo: {
            name: "mcp-client",
            version: "0.0.0",
          },
        },
      });

      const response = await server.handleRequest(clientReq);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(0);

      if ("error" in response) {
        expect(response.error.code).toBe(-32602);
        expect(response.error.message).toContain("Invalid request parameters");
      } else {
        fail("Expected an error response, got a result");
      }
    });

    it("negotiates unsupported protocolVersion to server's latest", async () => {
      const serverName = "example ping server";
      const serverVersion = "0.0.0";
      const server = new MCPServer({
        name: serverName,
        version: serverVersion,
      });

      const clientReq = newJSONRPCRequest({
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2099-01-01",
          capabilities: {
            sampling: {},
            roots: {
              listChanged: true,
            },
          },
          clientInfo: {
            name: "mcp-client",
            version: "0.0.0",
          },
        },
      });

      const response = await server.handleRequest(clientReq);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(0);

      if ("result" in response) {
        const result = response.result as InitializeResult;
        expect(result.protocolVersion).toBe(LATEST_PROTOCOL_VERSION);
        expect(result.serverInfo.name).toBe(serverName);
        expect(result.serverInfo.version).toBe(serverVersion);
      } else {
        fail("Expected a result response, got an error");
      }
    });
  });
});
