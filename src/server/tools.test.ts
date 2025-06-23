import { CustomValidator } from "../tools/custom.js";
import { MCPServer } from "./index.js";

describe("MCPServer Tools", () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: "test server",
      version: "1.0.0",
    });
  });

  describe("getTool", () => {
    it("returns undefined when no tools are registered", () => {
      const result = server.getTool("some-tool");
      expect(result).toBeUndefined();
    });

    it("returns undefined for non-existent tool", () => {
      server.addTool({
        name: "existing-tool",
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "test" }],
          isError: false,
        }),
      });

      const result = server.getTool("non-existent");
      expect(result).toBeUndefined();
    });

    it("returns the correct tool when it exists", () => {
      const toolName = "test-tool";
      const toolDescription = "A test tool";
      const inputSchema = {
        type: "object",
        properties: {
          input: { type: "string", description: "Test input" },
        },
        required: ["input"],
      };

      server.addTool({
        name: toolName,
        description: toolDescription,
        validator: new CustomValidator(inputSchema, (input: unknown) => {
          if (typeof input === "object" && input !== null && "input" in input) {
            return {
              success: true,
              data: input as { input: string },
              errorData: null,
            };
          }
          return { success: false, data: null, errorData: "Invalid input" };
        }),
        handler: async ({ input }) => ({
          content: [{ type: "text", text: `Processed: ${input}` }],
          isError: false,
        }),
      });

      const result = server.getTool(toolName);

      expect(result).toBeDefined();
      expect(result?.name).toBe(toolName);
      expect(result?.description).toBe(toolDescription);
      expect(result?.inputSchema).toEqual(inputSchema);
    });

    it("returns tool without description when description is not provided", () => {
      const toolName = "minimal-tool";

      server.addTool({
        name: toolName,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "minimal" }],
          isError: false,
        }),
      });

      const result = server.getTool(toolName);

      expect(result).toBeDefined();
      expect(result?.name).toBe(toolName);
      expect(result?.description).toBe(`Execute the ${toolName} tool`);
    });
  });

  describe("getTools", () => {
    it("returns empty Map when no tools are registered", () => {
      const result = server.getTools();
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it("returns Map with single tool", () => {
      const toolName = "single-tool";
      const toolDescription = "A single test tool";

      server.addTool({
        name: toolName,
        description: toolDescription,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "single" }],
          isError: false,
        }),
      });

      const result = server.getTools();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(1);
      expect(result.has(toolName)).toBe(true);

      const tool = result.get(toolName);
      expect(tool?.name).toBe(toolName);
      expect(tool?.description).toBe(toolDescription);
    });

    it("returns Map with multiple tools", () => {
      const tool1Name = "tool-one";
      const tool2Name = "tool-two";
      const tool3Name = "tool-three";

      // Add first tool
      server.addTool({
        name: tool1Name,
        description: "First tool",
        validator: new CustomValidator(
          { type: "object", properties: { a: { type: "number" } } },
          () => ({ success: true, data: { a: 1 }, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "one" }],
          isError: false,
        }),
      });

      // Add second tool
      server.addTool({
        name: tool2Name,
        description: "Second tool",
        validator: new CustomValidator(
          { type: "object", properties: { b: { type: "string" } } },
          () => ({ success: true, data: { b: "test" }, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "two" }],
          isError: false,
        }),
      });

      // Add third tool
      server.addTool({
        name: tool3Name,
        description: "Third tool",
        validator: new CustomValidator(
          { type: "object", properties: { c: { type: "boolean" } } },
          () => ({ success: true, data: { c: true }, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "three" }],
          isError: false,
        }),
      });

      const result = server.getTools();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
      expect(result.has(tool1Name)).toBe(true);
      expect(result.has(tool2Name)).toBe(true);
      expect(result.has(tool3Name)).toBe(true);

      // Verify each tool is correct
      expect(result.get(tool1Name)?.name).toBe(tool1Name);
      expect(result.get(tool1Name)?.description).toBe("First tool");
      expect(result.get(tool2Name)?.name).toBe(tool2Name);
      expect(result.get(tool2Name)?.description).toBe("Second tool");
      expect(result.get(tool3Name)?.name).toBe(tool3Name);
      expect(result.get(tool3Name)?.description).toBe("Third tool");
    });

    it("returns new Map instance on each call", () => {
      server.addTool({
        name: "test-tool",
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "test" }],
          isError: false,
        }),
      });

      const result1 = server.getTools();
      const result2 = server.getTools();

      expect(result1).not.toBe(result2); // Different instances
      expect(result1.size).toBe(result2.size); // Same content
      expect(result1.get("test-tool")).toEqual(result2.get("test-tool"));
    });

    it("reflects tool removal", () => {
      const toolName = "removable-tool";

      server.addTool({
        name: toolName,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "removable" }],
          isError: false,
        }),
      });

      let result = server.getTools();
      expect(result.size).toBe(1);
      expect(result.has(toolName)).toBe(true);

      // Remove the tool
      server.removeTool(toolName);

      result = server.getTools();
      expect(result.size).toBe(0);
      expect(result.has(toolName)).toBe(false);
    });
  });

  describe("integration with tool lifecycle", () => {
    it("getTool reflects tool addition", () => {
      const toolName = "lifecycle-tool";

      // Initially not found
      expect(server.getTool(toolName)).toBeUndefined();

      // Add tool
      server.addTool({
        name: toolName,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "lifecycle" }],
          isError: false,
        }),
      });

      // Now found
      const tool = server.getTool(toolName);
      expect(tool).toBeDefined();
      expect(tool?.name).toBe(toolName);
    });

    it("getTool reflects tool removal", () => {
      const toolName = "lifecycle-tool";

      server.addTool({
        name: toolName,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "lifecycle" }],
          isError: false,
        }),
      });

      // Initially found
      expect(server.getTool(toolName)).toBeDefined();

      // Remove tool
      server.removeTool(toolName);

      // No longer found
      expect(server.getTool(toolName)).toBeUndefined();
    });

    it("both methods work with tools that have output schemas", () => {
      const toolName = "output-schema-tool";
      const outputSchema = {
        type: "object" as const,
        properties: {
          result: { type: "string" },
          success: { type: "boolean" },
        },
      };

      server.addTool({
        name: toolName,
        validator: new CustomValidator(
          { type: "object", properties: {} },
          () => ({ success: true, data: {}, errorData: null })
        ),
        handler: async () => ({
          content: [{ type: "text", text: "output schema test" }],
          isError: false,
        }),
        outputSchema,
      });

      // Test getTool
      const singleTool = server.getTool(toolName);
      expect(singleTool?.outputSchema).toEqual(outputSchema);

      // Test getTools
      const allTools = server.getTools();
      expect(allTools.get(toolName)?.outputSchema).toEqual(outputSchema);
    });
  });
});
