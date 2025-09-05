import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import Ajv, { JSONSchemaType } from 'ajv';
import { CustomValidator } from '@zuplo/mcp/tools/custom';

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// MCP server
const server = new MCPServer({
  name: "Calculator",
  version: "0.0.0",
});

const ajv = new Ajv();

type NumberPair = { a: number; b: number };

const numberPairSchema: JSONSchemaType<NumberPair> = {
  type: "object",
  properties: {
    a: { type: "number" },
    b: { type: "number" },
  },
  required: ["a", "b"],
  additionalProperties: false,
};

const validateFn = ajv.compile<NumberPair>(numberPairSchema);

const numberPairValidator = new CustomValidator<NumberPair>(
  numberPairSchema,
  (input) => {
    if (validateFn(input)) {
      return { success: true, data: input, error: null }
    };

    return { success: false, data: null, error: ajv.errorsText(validateFn.errors) }
  }
);

server.addTool({
  name: "add",
  description: "Adds two numbers together",
  validator: numberPairValidator,
  handler: async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
    isError: false,
  }),
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
