import type { Logger } from "../logger/types.js";
import type {
  CallToolResult,
  ServerCapabilities,
  Tool,
} from "../mcp/20250618/types/types.js";

/**
 * InputParamValidatorReturn is the return type for the @type InputParamValidator
 *
 * @param T - the type expected in "data" on successful validation. Otherwise,
 * a string error is returned that is passed back through the protocol.
 */
export interface InputParamValidatorReturn<T> {
  success: boolean;
  data: T | null;
  errorData: unknown | null;
  errorMessage?: string;
}

/**
 * InputParamValidator is a runtime validator that an MCPServer uses to validate
 * a tool calls input params. This interface is implemented by validators
 * (like the Zod validator) which can be provided as pluggable systems for
 * checking a tools input params match an expected schema object.
 *
 * @param T - the type expected to be returned by "parse" in the validated
 * return data in @type InputParamValidatorReturn
 */
export interface InputParamValidator<T> {
  /**
   * The raw JSON-Schema used for JSONRPC messaging and metadata.)
   */
  jsonSchema: object;

  /**
   * The function provided by an implementor that is used during tool calls
   */
  parse(input: unknown): InputParamValidatorReturn<T>;
}

/**
 * ParsedData is the non-null "data" from a @type InputParamvalidatorReturn
 * as it's returned by a validator: this ensures type safety in a tool's
 * handler
 */
export type ParsedData<V extends InputParamValidator<unknown>> = NonNullable<
  ReturnType<V["parse"]>["data"]
>;

/**
 * Internal MCP server storage object for a registered tool
 *
 * @param V - is a @type InputParamValidator
 */
export type RegisteredTool<
  V extends InputParamValidator<unknown> = InputParamValidator<unknown>,
> = {
  tool: Tool;
  validator: V;
  handler: (params: ParsedData<V>) => Promise<CallToolResult> | CallToolResult;
};

/**
 * MCP Server configuration options
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

  /**
   * Logger instance for handling log messages
   * If not provided, a default logger will be used
   */
  logger?: Logger;
}
