import { JSONRPCRequest } from "@zuplo/mcp/jsonrpc2/types";
import { isJSONRPCResponse } from "@zuplo/mcp/jsonrpc2/validation";
import { MCPServer } from "@zuplo/mcp/server";
import { z } from "zod";

// Create a simple server
const server = new MCPServer({
  name: "Example Ping Server",
  version: "1.0.0",
});

server.addTool(
  "add",
  z.object({ a: z.number(), b: z.number() }),
  async ({ a, b }) => (
    [{ type: "text", text: String(a + b) }]
  )
);

// Example ping request
const toolRequest: JSONRPCRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "add",
    arguments: {
      a: 1,
      b: 2,
    },
  },
};

async function runExample() {
  console.log("Sending tool/call request:", toolRequest);
  const response = await server.handleRequest(toolRequest);
  if (isJSONRPCResponse(response)) {
    console.log("Received response:", JSON.stringify(response.result));
  } else {
    throw response;
  }
}

runExample().catch(console.error);
