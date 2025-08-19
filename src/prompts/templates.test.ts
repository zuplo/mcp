import {
  compileTemplateMessages,
  newTextPromptMessage,
  replaceTokens,
} from "./templates.js";

describe("Template utilities", () => {
  describe("replaceTokens", () => {
    it("replaces tokens in text content", () => {
      const content = {
        type: "text" as const,
        text: "Hello {{name}}, welcome to {{place}}!",
      };

      const result = replaceTokens(content, {
        name: "Alice",
        place: "Wonderland",
      });

      expect(result.type).toBe("text");
      if (result.type === "text") {
        expect(result.text).toBe("Hello Alice, welcome to Wonderland!");
      }
    });

    it("handles multiple occurrences of the same token", () => {
      const content = {
        type: "text" as const,
        text: "{{greeting}} {{name}}, {{greeting}} again!",
      };

      const result = replaceTokens(content, {
        greeting: "Hi",
        name: "Bob",
      });

      expect(result.type).toBe("text");
      if (result.type === "text") {
        expect(result.text).toBe("Hi Bob, Hi again!");
      }
    });

    it("leaves non-text content unchanged", () => {
      const content = {
        type: "image" as const,
        data: "base64data",
        mimeType: "image/png",
      };

      const result = replaceTokens(content, { name: "test" });

      expect(result).toEqual(content);
    });
  });

  describe("compileTemplateMessages", () => {
    it("compiles multiple messages with templates", () => {
      const messages = [
        newTextPromptMessage("user", "Hello {{name}}!"),
        newTextPromptMessage("assistant", "Hi {{name}}, how can I help you?"),
      ];

      const result = compileTemplateMessages(messages, { name: "Charlie" });

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe("user");
      expect(result[1].role).toBe("assistant");

      if (result[0].content.type === "text") {
        expect(result[0].content.text).toBe("Hello Charlie!");
      }

      if (result[1].content.type === "text") {
        expect(result[1].content.text).toBe("Hi Charlie, how can I help you?");
      }
    });
  });

  describe("newTextPromptMessage", () => {
    it("creates a text message with user role", () => {
      const message = newTextPromptMessage("user", "Test message");

      expect(message.role).toBe("user");
      expect(message.content.type).toBe("text");
      if (message.content.type === "text") {
        expect(message.content.text).toBe("Test message");
      }
    });

    it("creates a text message with assistant role", () => {
      const message = newTextPromptMessage("assistant", "Assistant response");

      expect(message.role).toBe("assistant");
      expect(message.content.type).toBe("text");
      if (message.content.type === "text") {
        expect(message.content.text).toBe("Assistant response");
      }
    });
  });
});
