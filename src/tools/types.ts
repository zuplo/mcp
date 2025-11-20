import type { CallToolResult, Tool } from "../mcp/20250618/types.js";
import type { InputParamValidator, ParsedData } from "../server/types.js";

/**
 * ToolConfig is the configuration object provided to "addTool". It is used
 * by callers to denote the name, description, validator, and handler of a tool.
 *
 * @param V - The input validator that is used to validate a tool call's params
 * @param R - The expected results of a tool call
 * defaults to @type CallToolResult
 */
export interface ToolConfig<
  V extends InputParamValidator<unknown>,
  R extends CallToolResult = CallToolResult,
> {
  name: string;
  validator: V;
  handler: (params: ParsedData<V>) => Promise<R> | R;
  description?: string;
  outputSchema?: Tool["outputSchema"];
  annotation?: Tool["annotations"];
  _meta?: Tool["_meta"];
}
