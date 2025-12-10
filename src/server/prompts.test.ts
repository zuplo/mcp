import { z } from "zod/v4";
import { type JSONRPCRequest, newJSONRPCRequest } from "../jsonrpc2/types.js";
import type {
  GetPromptResult,
  ListPromptsResult,
} from "../mcp/20251125/types.js";
import { newTextPromptMessage } from "../prompts/templates.js";
import { ZodValidator } from "../tools/zod.js";
import { MCPServer } from "./index.js";

describe("MCPServer Prompts", () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: "test-server",
      version: "1.0.0",
    });
  });

  describe("prompt registration", () => {
    it("allows registering and retrieving prompts", () => {
      const promptConfig = {
        name: "greeting",
        description: "Generate a greeting message",
        validator: new ZodValidator(z.object({ name: z.string() })),
        generator: (args: { name: string }) => [
          newTextPromptMessage("assistant", `Hello, ${args.name}!`),
        ],
        arguments: [
          {
            name: "name",
            description: "The name to greet",
            required: true,
          },
        ],
      };

      server.addPrompt(promptConfig);

      const retrievedPrompt = server.getPrompt("greeting");
      expect(retrievedPrompt).toBeDefined();
      expect(retrievedPrompt?.name).toBe("greeting");
      expect(retrievedPrompt?.description).toBe("Generate a greeting message");
      expect(retrievedPrompt?.arguments).toHaveLength(1);
    });

    it("allows removing prompts", () => {
      const promptConfig = {
        name: "test-prompt",
        validator: new ZodValidator(z.object({})),
        generator: () => [newTextPromptMessage("assistant", "Test")],
      };

      server.addPrompt(promptConfig);
      expect(server.getPrompt("test-prompt")).toBeDefined();

      const removed = server.removePrompt("test-prompt");
      expect(removed).toBe(true);
      expect(server.getPrompt("test-prompt")).toBeUndefined();
    });

    it("returns false when removing non-existent prompt", () => {
      const removed = server.removePrompt("non-existent");
      expect(removed).toBe(false);
    });
  });

  describe("prompts/list request", () => {
    it("returns empty list when no prompts are registered", async () => {
      const request: JSONRPCRequest = newJSONRPCRequest({
        id: 1,
        method: "prompts/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListPromptsResult;
        expect(result.prompts).toEqual([]);
      } else {
        fail("Expected result, got error");
      }
    });

    it("returns registered prompts", async () => {
      const promptConfig = {
        name: "greeting",
        description: "Generate a greeting",
        validator: new ZodValidator(z.object({ name: z.string() })),
        generator: (args: { name: string }) => [
          newTextPromptMessage("assistant", `Hello, ${args.name}!`),
        ],
      };

      server.addPrompt(promptConfig);

      const request = newJSONRPCRequest({
        id: 1,
        method: "prompts/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListPromptsResult;
        expect(result.prompts).toHaveLength(1);
        expect(result.prompts[0].name).toBe("greeting");
        expect(result.prompts[0].description).toBe("Generate a greeting");
      } else {
        fail("Expected result, got error");
      }
    });
  });

  describe("prompts/get request", () => {
    beforeEach(() => {
      const promptConfig = {
        name: "greeting",
        description: "Generate a greeting message",
        validator: new ZodValidator(z.object({ name: z.string() })),
        generator: (args: { name: string }) => [
          newTextPromptMessage("assistant", `Hello, ${args.name}!`),
        ],
        arguments: [
          {
            name: "name",
            description: "The name to greet",
            required: true,
          },
        ],
      };

      server.addPrompt(promptConfig);
    });

    it("generates prompt with valid arguments", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "prompts/get",
        params: {
          name: "greeting",
          arguments: {
            name: "Alice",
          },
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as GetPromptResult;
        expect(result.description).toBe("Generate a greeting message");
        expect(result.messages).toHaveLength(1);
        expect(result.messages[0].role).toBe("assistant");
        expect(result.messages[0].content.type).toBe("text");
        if (result.messages[0].content.type === "text") {
          expect(result.messages[0].content.text).toBe("Hello, Alice!");
        }
      } else {
        fail("Expected result, got error");
      }
    });

    it("returns error for non-existent prompt", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "prompts/get",
        params: {
          name: "non-existent",
          arguments: {},
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("error" in response) {
        expect(response.error.code).toBe(-32602);
        expect(response.error.message).toContain(
          'Prompt "non-existent" not found'
        );
      } else {
        fail("Expected error, got result");
      }
    });

    it("returns error for invalid arguments", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "prompts/get",
        params: {
          name: "greeting",
          arguments: {
            // missing required 'name' argument
          },
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("error" in response) {
        expect(response.error.code).toBe(-32602);
        expect(response.error.message).toContain("Invalid arguments");
      } else {
        fail("Expected error, got result");
      }
    });
  });

  describe("capabilities", () => {
    it("includes prompts capability by default", () => {
      const capabilities = server.getCapabilities();
      expect(capabilities.prompts).toBeDefined();
    });
  });
});
