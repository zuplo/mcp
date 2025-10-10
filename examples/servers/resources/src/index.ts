import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MCPServer } from "@zuplo/mcp/server";
import { HTTPStreamableTransport } from "@zuplo/mcp/transport/httpstreamable";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { ResourceMetadata, ResourceReader, URITemplate } from "@zuplo/mcp/resources";

const app = new Hono();

const logger = new ConsoleLogger();

const server = new MCPServer({
  name: "Resources Example Server",
  version: "1.0.0",
  logger,
  capabilities: {
    resources: {},
  },
});

server.addResource(
  "document",
  "file:///example/document.txt",
  {
    title: "Example Document",
    description: "A sample text document",
    mimeType: "text/plain",
    annotations: {
      audience: ["user" as const, "assistant" as const],
      priority: 0.8,
    },
  },
  async (uri) => ({
    contents: [
      {
        uri,
        mimeType: "text/plain",
        text: "This is a sample document.\n\nIt contains multiple lines of text that demonstrate how resources work in the MCP protocol.",
      },
    ],
  })
);

server.addResource(
  "data",
  "file:///example/data.json",
  {
    title: "Sample Data",
    description: "JSON data file with sample information",
    mimeType: "application/json",
    annotations: {
      audience: ["assistant" as const],
      priority: 0.5,
    },
  },
  async (uri) => ({
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            name: "Example Data",
            items: [
              { id: 1, value: "First item" },
              { id: 2, value: "Second item" },
              { id: 3, value: "Third item" },
            ],
            metadata: {
              created: "2025-01-01",
              version: "1.0",
            },
          },
          null,
          2
        ),
      },
    ],
  })
);

server.addResource(
  "image",
  "file:///example/image.png",
  {
    title: "Example Image",
    description: "A sample PNG image",
    mimeType: "image/png",
  },
  async (uri) => ({
    contents: [
      {
        uri,
        mimeType: "image/png",
        blob: "aW1hZ2Vwbmc=",
      },
    ],
  })
);

const uriTemp: URITemplate = { template: "file:///example/{filename}" };
const resMetadata: ResourceMetadata = {
  title: "📁 Example Files",
  description: "Access any file in the example directory by name",
  annotations: {
    audience: ["user" as const],
    priority: 0.6,
  }
};

const resHandler: ResourceReader = async (uri) => {
  const filename = uri.split("/").pop();
  return {
    contents: [
      {
        uri,
        mimeType: "text/plain",
        text: `This is a dynamically generated file: ${filename}`,
      },
    ],
  };
};

server.addResource(
  "files",
  uriTemp,
  resMetadata,
  resHandler
);

const transport = new HTTPStreamableTransport({ logger });
await transport.connect();
server.withTransport(transport);

app.post("/mcp", async (c) => {
  try {
    const request = c.req.raw;
    return transport.handleRequest(request);
  } catch (error) {
    logger.error("Error handling MCP request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

logger.info("Resources MCP server starting on port 3000");
serve({
  fetch: app.fetch,
  port: 3000
});
