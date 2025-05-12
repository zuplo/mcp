import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// MCP server
const server = new MCPServer({
  name: "Example Ping Server",
  version: "1.0.0",
});

// HTTP Streamable Transport
const transport = new HTTPStreamableTransport();
await transport.connect();
server.withTransport(transport);

// Set up a POST route for MCP requests
app.post('/mcp', async (c) => {
  try {
    const request = c.req.raw;
    return transport.handleRequest(request);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

console.log("serving on port 3000")
serve({
  fetch: app.fetch,
  port: 3000
});
