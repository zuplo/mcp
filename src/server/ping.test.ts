import type { JSONRPCRequest } from "../jsonrpc2/types.js";
import { ConsoleLogger } from "../logger/index.js";
import { MCPServer } from "./index.js";

describe("MCPServer", () => {
  describe("ping", () => {
    it("properly handles ping request", async () => {
      const server = new MCPServer({
        name: "example ping server",
        version: "0.0.0",
        logger: new ConsoleLogger(),
      });

      console.log("Sending ping request to MCPServer...");
      const pingRequest: JSONRPCRequest = {
        jsonrpc: "2.0",
        id: "123",
        method: "ping",
      };

      const response = await server.handleRequest(pingRequest);
      console.log("Received response from MCPServer:", response);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
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
