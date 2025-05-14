import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { z } from 'zod';
import { ZodValidator } from '@zuplo/mcp/tools/zod';

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// MCP server
const server = new MCPServer({
  name: "Calculator",
  version: "0.0.0",
});

// addition
server.addTool({
  name: "add",
  description: "Adds two numbers together and returns the result.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number")
    })
  ),
  handler: async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }],
    isError: false,
  })
});

// subtraction
server.addTool({
  name: "subtract",
  description: "Subtracts the second number from the first and returns the result.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("Number to subtract from"),
      b: z.number().describe("Number to subtract")
    })
  ),
  handler: async ({ a, b }) => ({
    content: [{ type: "text", text: String(a - b) }],
    isError: false,
  })
});

// multiplication
server.addTool({
  name: "multiply",
  description: "Multiplies two numbers together and returns the result.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("First number"),
      b: z.number().describe("Second number")
    })
  ),
  handler: async ({ a, b }) => ({
    content: [{ type: "text", text: String(a * b) }],
    isError: false,
  })
});

// division
server.addTool({
  name: "divide",
  description: "Divides the first number by the second and returns the result.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("Dividend (number to be divided)"),
      b: z.number()
        .refine(val => val !== 0, {
          message: "Cannot divide by zero"
        })
        .describe("Divisor (number to divide by)")
    })
  ),
  handler: async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [{ type: "text", text: "Error: Division by zero is not allowed" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: String(a / b) }],
      isError: false,
    };
  }
});

// I have the power!!
server.addTool({
  name: "power",
  description: "Raises the first number to the power of the second number.",
  validator: new ZodValidator(
    z.object({
      base: z.number().describe("The base number"),
      exponent: z.number().describe("The exponent")
    })
  ),
  handler: async ({ base, exponent }) => ({
    content: [{ type: "text", text: String(Math.pow(base, exponent)) }],
    isError: false,
  })
});

// square root
server.addTool({
  name: "sqrt",
  description: "Calculates the square root of the given number.",
  validator: new ZodValidator(
    z.object({
      number: z.number()
        .min(0, { message: "Cannot calculate square root of negative numbers" })
        .describe("The number to calculate the square root of")
    })
  ),
  handler: async ({ number }) => {
    if (number < 0) {
      return {
        content: [{ type: "text", text: "Error: Cannot calculate square root of negative numbers" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: String(Math.sqrt(number)) }],
      isError: false,
    };
  }
});

// modulo
server.addTool({
  name: "modulo",
  description: "Returns the remainder of dividing the first number by the second.",
  validator: new ZodValidator(
    z.object({
      a: z.number().describe("Dividend"),
      b: z.number()
        .refine(val => val !== 0, {
          message: "Modulo by zero is not allowed"
        })
        .describe("Divisor")
    })
  ),
  handler: async ({ a, b }) => {
    if (b === 0) {
      return {
        content: [{ type: "text", text: "Error: Modulo by zero is not allowed" }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: String(a % b) }],
      isError: false,
    };
  }
});

// factorial
server.addTool({
  name: "factorial",
  description: "Calculates the factorial of the given integer.",
  validator: new ZodValidator(
    z.object({
      number: z.number()
        .int()
        .min(0, { message: "Factorial is only defined for non-negative integers" })
        .max(170, { message: "Number too large, would cause overflow" })
        .describe("The non-negative integer to calculate factorial for")
    })
  ),
  handler: async ({ number }) => {
    if (number < 0 || !Number.isInteger(number)) {
      return {
        content: [{ type: "text", text: "Error: Factorial is only defined for non-negative integers" }],
        isError: true,
      };
    }

    let result = 1;
    for (let i = 2; i <= number; i++) {
      result *= i;
    }

    return {
      content: [{ type: "text", text: String(result) }],
      isError: false,
    };
  }
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
