import type { ZodSchema, z } from "zod";
import type { ServerCapabilities, Tool } from "../mcp/20250326/types/types.js";

/**
 * Handler function for tool execution
 */
export type ToolHandler<S extends ZodSchema, R = unknown> = (
  params: z.infer<S>
) => Promise<R> | R;

/**
 * Internal storage type for registered tools
 */
export type RegisteredTool<S extends ZodSchema = ZodSchema, R = unknown> = {
  toolSchema: Tool;
  inputSchema: S;
  handler: ToolHandler<S, R>;
};

/**
 * Server options for configuration
 */
export interface MCPServerOptions {
  /**
   * Server name
   */
  name: string;

  /**
   * Server version
   */
  version: string;

  /**
   * Custom capabilities (will be merged with defaults)
   */
  capabilities?: ServerCapabilities;
}
