import { JSONRPCRequest } from "@zuplo/mcp/jsonrpc2/types";
import { MCPServer } from "@zuplo/mcp/server";

// Create a simple server
const server = new MCPServer({
  name: "Example Ping Server",
  version: "1.0.0",
});

console.log("Server capabilities:", server.getCapabilities());

// Example ping request
const pingRequest: JSONRPCRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "ping",
};

async function runExample() {
  console.log("Sending ping request:", pingRequest);
  const response = await server.handleRequest(pingRequest);
  console.log("Received response:", response);
}

runExample().catch(console.error);
