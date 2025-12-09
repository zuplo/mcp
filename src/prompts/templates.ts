import type { PromptMessage, TextContent } from "../mcp/20251125/types.js";

/**
 * Simple template engine that replaces {{variable}} tokens with values
 */
export function replaceTokens(
  content: PromptMessage["content"],
  args: Record<string, string>
): PromptMessage["content"] {
  if (content.type === "text") {
    const textContent = content as TextContent;
    let text = textContent.text;

    // Replace {{variable}} tokens with values
    for (const [key, value] of Object.entries(args)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      text = text.replace(pattern, value);
    }

    return {
      ...textContent,
      text,
    };
  }

  // For non-text content, return as-is
  return content;
}

/**
 * Utility function to compile template messages with argument substitution
 */
export function compileTemplateMessages(
  templateMessages: PromptMessage[],
  args: Record<string, string>
): PromptMessage[] {
  return templateMessages.map((message) => ({
    ...message,
    content: replaceTokens(message.content, args),
  }));
}

/**
 * Utility for creating correctly typed text messages
 */
export function newTextPromptMessage(
  role: "user" | "assistant",
  text: string
): PromptMessage {
  return {
    role,
    content: {
      type: "text",
      text,
    },
  };
}
