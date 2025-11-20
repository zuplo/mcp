// Adopted from:
// https://developers.openai.com/apps-sdk/quickstart

import { serve } from '@hono/node-server'
import { Hono } from 'hono';
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { z } from "zod/v4";
import { ZodValidator } from '@zuplo/mcp/tools/zod';
import { readFileSync } from 'fs';

// Hono app for routing and handling fetch API Request / Response
const app = new Hono();

// Create a logger instance
const logger = new ConsoleLogger();

// MCP server
const server = new MCPServer({
  name: "OpenAI Apps SDK",
  version: "0.0.0",
  logger,
});

// Todo app logic and storage
const todoHtml = readFileSync("static/todo-widget.html", "utf8");
let todos: { id: number, title: string, completed: boolean }[] = [];
let nextId = 1;

// Resource for serving HTML widget to agent
server.addResource(
  "todo-widget",
  "ui://widget/todo.html",
  {},
  async () => ({
    contents: [
      {
        uri: "ui://widget/todo.html",
        mimeType: "text/html+skybridge",
        text: todoHtml,
        _meta: { "openai/widgetPrefersBorder": true },
      },
    ],
  })
);

// Read-only Tool for fetching todos
server.addTool({
  name: "list_todos",
  description: "Lists the todos.",
  validator: new ZodValidator(
    z.object({})
  ),
  annotation: {
    readOnlyHint: true,
  },
  _meta: {
    "openai/outputTemplate": "ui://widget/todo.html",
    "openai/toolInvocation/invoking": "Listing todo",
    "openai/toolInvocation/invoked": "Listed todo",
  },
  handler: async () => {
    return {
      content: [
        {
          type: "text", text: `Current todos: ${JSON.stringify(todos)}`
        }
      ],
      structuredContent: { tasks: todos },
      isError: false,
    }
  }
});

// Tool for adding a todo
server.addTool({
  name: "add_todo",
  description: "Creates a todo item with the given title.",
  validator: new ZodValidator(
    z.object({
      title: z.string().describe("Todo title").min(1),
    })
  ),
  _meta: {
    "openai/outputTemplate": "ui://widget/todo.html",
    "openai/toolInvocation/invoking": "Adding todo",
    "openai/toolInvocation/invoked": "Added todo",
  },
  handler: async ({ title }) => {
    const todo = { id: nextId++, title, completed: false };
    todos = [...todos, todo];
    return {
      content: [
        {
          type: "text", text: `Added todo ${title}`
        }
      ],
      structuredContent: { tasks: todos },
      isError: false,
    }
  }
});

// Tool for completing a todo
server.addTool({
  name: "complete_todo",
  description: "Marks a todo as done by id.",
  validator: new ZodValidator(
    z.object({
      id: z.number().describe("Todo id").min(1),
    })
  ),
  _meta: {
    "openai/outputTemplate": "ui://widget/todo.html",
    "openai/toolInvocation/invoking": "Completing todo",
    "openai/toolInvocation/invoked": "Completed todo",
  },
  handler: async ({ id }) => {
    const todo = todos.find((task) => task.id === id);
    if (!todo) {
      return {
        content: [{ type: "text", text: "Error: could not find todo" }],
        isError: true,
      };
    }

    todos = todos.map((task) =>
      task.id === id ? { ...task, completed: true } : task
    );

    return {
      content: [{ type: "text", text: `Completed ${todo.title}` }],
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

logger.info("OpenAI Apps SDK todo MCP server starting on port 3000");
serve({
  fetch: app.fetch,
  port: 3000
});
