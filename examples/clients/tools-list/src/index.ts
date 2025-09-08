import { MCPClient } from "@zuplo/mcp/client";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { HTTPClientTransport } from "@zuplo/mcp/transport/httpclient";

const logger = new ConsoleLogger();
const client = new MCPClient({
  name: "Tools list client",
  version: "0.0.0",
  logger,
});

const url = process.env.BASE_URL || "http://localhost:3000/mcp"

try {
  const transport = new HTTPClientTransport({
    url,
    logger,
  });

  await client.connect(transport);
  const initResult = await client.initialize();

  logger.info("Connected successfully!", {
    serverInfo: initResult.serverInfo,
    protocolVersion: initResult.protocolVersion,
  });

  const tools = await client.listTools();
  logger.info(`Found ${tools.length} tools:`, tools.map(t => t.name));
} catch (error) {
  logger.error("Error running client example:", error);
} finally {
  // Disconnect
  await client.disconnect();
  logger.info("Disconnected from server");
}
