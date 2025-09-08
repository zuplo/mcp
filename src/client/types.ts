import type { Logger } from "../logger/types.js";
import type { ClientCapabilities } from "../mcp/20250618/types.js";

export interface MCPClientOptions {
  name?: string;
  version?: string;
  logger?: Logger;
  capabilities?: ClientCapabilities;
}
