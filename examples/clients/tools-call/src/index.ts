import { MCPClient } from "@zuplo/mcp/client";
import { ConsoleLogger } from "@zuplo/mcp/logger";
import { HTTPClientTransport } from "@zuplo/mcp/transport/httpclient";

const logger = new ConsoleLogger();
const client = new MCPClient({
  name: "Ping client",
  version: "0.0.0",
  logger,
});

// This MCP client is intended to be tested against a calculator MCP server
// with tools "add" and "divide".
// The divide tool uses 0 as a denominator to simulating throwing an error.
const url = process.env.BASE_URL || "http://localhost:3000/mcp"

try {
  // Create transport to connect to the calculator server
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

  const addResult = await client.callTool("add", { a: 5, b: 3 });
  logger.info("5 + 3 =", addResult);

  // Test error handling - division by zero
  try {
    const divideResult = await client.callTool("divide", { a: 10, b: 0 });
    logger.info("10 ÷ 0 =", divideResult);
  } catch (error) {
    logger.info("Expected error for division by zero:", error);
  }
} catch (error) {
  logger.error("Error running client example:", error);
} finally {
  await client.disconnect();
}
