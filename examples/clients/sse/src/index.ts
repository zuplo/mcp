import { MCPClient } from "@zuplo/mcp/client";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { HTTPClientTransport } from "@zuplo/mcp/transport/httpclient";

const logger = new ConsoleLogger();
const client = new MCPClient({
  name: "GitHub SSE client",
  version: "0.0.0",
  logger,
});

const url = "https://api.githubcopilot.com/mcp/";
const authToken = process.env.AUTH_TOKEN;

if (!authToken) {
  throw Error(
    "no AUTH_TOKEN env var provided. Please provide a GitHub PAT for use with the GitHub MCP server."
  );
}

try {
  const transport = new HTTPClientTransport({
    url,
    logger,
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  await client.connect(transport);
  const initResult = await client.initialize();

  logger.info("Connected successfully!", {
    serverInfo: initResult.serverInfo,
    protocolVersion: initResult.protocolVersion,
  });

  const userResult = await client.callTool("get_me", {});
  logger.info("GitHub user:", userResult);
} catch (error) {
  logger.error("Error running client example:", error);
} finally {
  await client.disconnect();
}
