import { JSONRPC_VERSION } from "../jsonrpc2/consts.js";
import { type JSONRPCRequest, newJSONRPCRequest } from "../jsonrpc2/types.js";
import { MCPServer } from "./index.js";

describe("MCPServer", () => {
  describe("ping", () => {
    it("properly handles ping request", async () => {
      const server = new MCPServer({
        name: "example ping server",
        version: "0.0.0",
      });

      const pingRequest: JSONRPCRequest = newJSONRPCRequest({
        id: "123",
        method: "ping",
      });

      const response = await server.handleRequest(pingRequest);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe(JSONRPC_VERSION);
      expect(response.id).toBe("123");

      if ("result" in response) {
        // resulting "pong" should be an empty object
        expect(response.result).toEqual({});
      } else {
        fail("Expected a result response, got an error response");
      }
    });
  });
});
