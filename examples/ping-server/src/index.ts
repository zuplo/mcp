import { JSONRPCRequest } from "@zuplo/mcp/jsonrpc2/types";
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";

// Creates a simple MCP server
const server = new MCPServer({
  name: "Example Ping Server",
  version: "1.0.0",
});

console.log("Server capabilities:", server.getCapabilities());

// HTTP Streamable Transport for handling POST Requests
const transport = new HTTPStreamableTransport()
await transport.connect();

server.withTransport(transport);

// 1. Initialize the server
const initRequest: JSONRPCRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "ExampleClient",
      version: "1.0.0"
    }
  }
}

// Package ping JSONRPC2 into Request
let httpRequest = new Request("http://example.com/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify(initRequest)
});

try {
  const response = await transport.handleRequest(httpRequest);
  const bodyText = await response.text();

  console.log("HTTP Status:", response.status);
  console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  console.log("Response body:", bodyText);
} catch (e) {
  console.log("Error", e);
}

// Example ping request
const pingRequest: JSONRPCRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "ping",
};

// Package ping JSONRPC2 into Request
httpRequest = new Request("http://example.com/mcp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  },
  body: JSON.stringify(pingRequest)
});

// Handle the request using the transport
console.log("Sending HTTP request with ping payload");
try {
  const response = await transport.handleRequest(httpRequest);
  const bodyText = await response.text();

  console.log("HTTP Status:", response.status);
  console.log("Response headers:", Object.fromEntries(response.headers.entries()));
  console.log("Response body:", bodyText);
} catch (e) {
  console.log("Error", e);
}
