import { MCPClient } from "@zuplo/mcp/client";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { HTTPClientTransport } from "@zuplo/mcp/transport/httpclient";

const logger = new ConsoleLogger();
const client = new MCPClient({
  name: "Ping client",
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

  logger.info("Attempting ping ...");
  await client.ping();
  logger.info("Ping successful!");
} catch (error) {
  logger.error("Error running client example:", error);
} finally {
  await client.disconnect();
  logger.info("Disconnected from server");
}
