import type { ZodSchema, z } from "zod";
import type {
  CallToolResult,
  ServerCapabilities,
  Tool,
} from "../mcp/20250326/types/types.js";

/**
 * Handler function for tool execution
 */
export type ToolHandler<
  S extends ZodSchema,
  R extends CallToolResult = CallToolResult,
> = (params: z.infer<S>) => Promise<R> | R;

/**
 * Configuration for registering a tool
 */
export interface ToolConfig<
  S extends ZodSchema,
  R extends CallToolResult = CallToolResult,
> {
  name: string;
  schema: S;
  handler: ToolHandler<S, R>;
  description?: string;
}

/**
 * Internal storage type for registered tools
 */
export type RegisteredTool<
  S extends ZodSchema = ZodSchema,
  R extends CallToolResult = CallToolResult,
> = {
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

  /**
   * Custom, optional instructions to provide to the client during initialization
   */
  instructions?: string;
}
