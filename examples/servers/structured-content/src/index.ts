import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { z } from "zod/v4";
import { ZodValidator } from '@zuplo/mcp/tools/zod';

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// Create a logger instance
const logger = new ConsoleLogger();

// MCP server
const server = new MCPServer({
  name: "Example server",
  version: "0.0.0",
  logger,
});

// simple "say hello" tool that has both content.text and structuredContent
server.addTool({
  name: "say_hello",
  description: "Simple hello to demonstrate using structuredContent",
  validator: new ZodValidator(
    z.object({})
  ),
  handler: async () => ({
    content: [{ type: "text", text: `{ "hello": "world" }` }],
    structuredContent: { hello: "world" },
    isError: false,
  })
});

// HTTP Streamable Transport
const transport = new HTTPStreamableTransport({ logger });
await transport.connect();
server.withTransport(transport);

// Set up a POST route for MCP requests
app.post('/mcp', async (c) => {
  try {
    const request = c.req.raw;
    return transport.handleRequest(request);
  } catch (error) {
    logger.error('Error handling MCP request:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

logger.info("Calculator MCP server starting on port 3000");
serve({
  fetch: app.fetch,
  port: 3000
});
