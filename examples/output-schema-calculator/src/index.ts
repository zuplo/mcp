import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { z } from 'zod';
import { ZodValidator } from '@zuplo/mcp/tools/zod';

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// Create a logger instance
const logger = new ConsoleLogger();

// MCP server
const server = new MCPServer({
  name: "Calculator",
  version: "0.0.0",
  logger,
});

// advanced calculation with structuredContent and outputSchema
server.addTool({
  name: "advancedCalculation",
  description: "Performs multiple calculations and returns structured results with operation details.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number")
    })
  ),
  outputSchema: {
    type: "object",
    properties: {
      sum: { type: "number", description: "The sum of the two numbers" },
      difference: { type: "number", description: "The difference between the two numbers" },
      product: { type: "number", description: "The product of the two numbers" },
      quotient: { type: "number", description: "The quotient of dividing first by second (if divisible)" },
      operations: {
        type: "array",
        items: {
          type: "object",
          properties: {
            operation: { type: "string", description: "The type of operation performed" },
            result: { type: "number", description: "The result of the operation" },
            formula: { type: "string", description: "The formula used" }
          },
          required: ["operation", "result", "formula"]
        },
        description: "List of all operations performed"
      }
    },
    required: ["sum", "difference", "product", "operations"]
  },
  handler: async ({ a, b }) => {
    const sum = a + b;
    const difference = a - b;
    const product = a * b;
    const quotient = b !== 0 ? a / b : null;

    const operations = [
      { operation: "addition", result: sum, formula: `${a} + ${b} = ${sum}` },
      { operation: "subtraction", result: difference, formula: `${a} - ${b} = ${difference}` },
      { operation: "multiplication", result: product, formula: `${a} × ${b} = ${product}` }
    ];

    if (quotient !== null) {
      operations.push({ operation: "division", result: quotient, formula: `${a} ÷ ${b} = ${quotient}` });
    }

    const structuredResult = {
      sum,
      difference,
      product,
      ...(quotient !== null && { quotient }),
      operations
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(structuredResult)
      }],
      structuredContent: structuredResult,
      isError: false,
    };
  }
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
