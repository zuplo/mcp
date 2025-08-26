import type { Prompt, PromptMessage } from "../mcp/20250618/types.js";
import type { InputParamValidator, ParsedData } from "../server/types.js";

/**
 * PromptGenerator is a function that takes validated arguments and returns
 * an array of prompt messages. This is analogous to a tool handler.
 */
export type PromptGenerator<V extends InputParamValidator<unknown>> = (
  args: ParsedData<V>
) => Promise<PromptMessage[]> | PromptMessage[];

/**
 * Configuration for registering a prompt with the MCP server.
 * Similar to ToolConfig but for prompts.
 */
export interface PromptConfig<V extends InputParamValidator<unknown>> {
  /**
   * The name of the prompt
   */
  name: string;

  /**
   * An optional description of what this prompt provides
   */
  description?: string;

  /**
   * Validator for prompt arguments
   */
  validator: V;

  /**
   * Function that generates prompt messages from validated arguments
   */
  generator: PromptGenerator<V>;
}

/**
 * Internal MCP server storage object for a registered prompt
 */
export type RegisteredPrompt<
  V extends InputParamValidator<unknown> = InputParamValidator<unknown>,
> = {
  prompt: Prompt;
  validator: V;
  generator: PromptGenerator<V>;
};
