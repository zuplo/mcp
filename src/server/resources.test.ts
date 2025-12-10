import { type JSONRPCRequest, newJSONRPCRequest } from "../jsonrpc2/types.js";
import type {
  ListResourceTemplatesResult,
  ListResourcesResult,
  ReadResourceResult,
} from "../mcp/20251125/types.js";
import { MCPServer } from "./index.js";

describe("MCPServer Resources", () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: "test-server",
      version: "1.0.0",
    });
  });

  describe("resource registration", () => {
    it("allows adding and retrieving resources", () => {
      server.addResource(
        "test",
        "file:///test.txt",
        {
          title: "Test File",
          description: "A test file",
          mimeType: "text/plain",
        },
        async (uri) => ({
          contents: [
            {
              uri,
              mimeType: "text/plain",
              text: "test content",
            },
          ],
        })
      );

      const retrievedResource = server.getResource("test");
      expect(retrievedResource).toBeDefined();
      expect(retrievedResource?.name).toBe("test");
      expect(retrievedResource?.uri).toBe("file:///test.txt");
      expect(retrievedResource?.title).toBe("Test File");
    });

    it("allows removing resources", () => {
      server.addResource(
        "test-resource",
        "file:///test.txt",
        { mimeType: "text/plain" },
        async () => ({ contents: [] })
      );

      expect(server.getResource("test-resource")).toBeDefined();

      const removed = server.removeResource("test-resource");
      expect(removed).toBe(true);
      expect(server.getResource("test-resource")).toBeUndefined();
    });

    it("returns false when removing non-existent resource", () => {
      const removed = server.removeResource("non-existent");
      expect(removed).toBe(false);
    });

    it("allows adding resource templates", () => {
      server.addResource(
        "files",
        { template: "file:///{path}" },
        { description: "Access files" },
        async (uri) => ({ contents: [{ uri, text: "content" }] })
      );

      const retrievedTemplate = server.getResourceTemplate("files");
      expect(retrievedTemplate).toBeDefined();
      expect(retrievedTemplate?.name).toBe("files");
      expect(retrievedTemplate?.uriTemplate).toBe("file:///{path}");
    });
  });

  describe("resources/list request", () => {
    it("returns empty list when no resources are registered", async () => {
      const request: JSONRPCRequest = newJSONRPCRequest({
        id: 1,
        method: "resources/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListResourcesResult;
        expect(result.resources).toEqual([]);
      } else {
        fail("Expected result, got error");
      }
    });

    it("returns registered resources", async () => {
      server.addResource(
        "test",
        "file:///test.txt",
        {
          title: "Test File",
          description: "A test file",
          mimeType: "text/plain",
        },
        async (uri) => ({
          contents: [{ uri, mimeType: "text/plain", text: "content" }],
        })
      );

      server.addResource(
        "data",
        "file:///data.json",
        {
          title: "Data File",
          mimeType: "application/json",
        },
        async (uri) => ({
          contents: [{ uri, mimeType: "application/json", text: "{}" }],
        })
      );

      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListResourcesResult;
        expect(result.resources).toHaveLength(2);
        expect(result.resources[0].name).toBe("test");
        expect(result.resources[1].name).toBe("data");
      } else {
        fail("Expected result, got error");
      }
    });

    it("does not include templates in resources list", async () => {
      server.addResource(
        "doc",
        "file:///doc.txt",
        { mimeType: "text/plain" },
        async (uri) => ({ contents: [{ uri, text: "doc" }] })
      );

      server.addResource(
        "files",
        { template: "file:///{path}" },
        { description: "Files" },
        async (uri) => ({ contents: [{ uri, text: "file" }] })
      );

      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListResourcesResult;
        expect(result.resources).toHaveLength(1);
        expect(result.resources[0].name).toBe("doc");
      } else {
        fail("Expected result, got error");
      }
    });
  });

  describe("resources/templates/list request", () => {
    it("returns empty list when no templates are registered", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/templates/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListResourceTemplatesResult;
        expect(result.resourceTemplates).toEqual([]);
      } else {
        fail("Expected result, got error");
      }
    });

    it("returns registered templates", async () => {
      server.addResource(
        "files",
        { template: "file:///example/{filename}" },
        {
          title: "Example Files",
          description: "Access files",
        },
        async (uri) => ({ contents: [{ uri, text: "content" }] })
      );

      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/templates/list",
        params: {},
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ListResourceTemplatesResult;
        expect(result.resourceTemplates).toHaveLength(1);
        expect(result.resourceTemplates[0].name).toBe("files");
        expect(result.resourceTemplates[0].uriTemplate).toBe(
          "file:///example/{filename}"
        );
      } else {
        fail("Expected result, got error");
      }
    });
  });

  describe("resources/read request", () => {
    beforeEach(() => {
      server.addResource(
        "test",
        "file:///test.txt",
        { mimeType: "text/plain" },
        async (uri: string) => {
          if (uri === "file:///test.txt") {
            return {
              contents: [
                {
                  uri,
                  mimeType: "text/plain",
                  text: "Hello, World!",
                },
              ],
            };
          }
          throw new Error("Resource not found");
        }
      );
    });

    it("reads a valid resource", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/read",
        params: {
          uri: "file:///test.txt",
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ReadResourceResult;
        expect(result.contents).toHaveLength(1);
        expect(result.contents[0].uri).toBe("file:///test.txt");
        if ("text" in result.contents[0]) {
          expect(result.contents[0].text).toBe("Hello, World!");
        }
      } else {
        fail("Expected result, got error");
      }
    });

    it("returns error for non-existent resource", async () => {
      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/read",
        params: {
          uri: "file:///nonexistent.txt",
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("error" in response) {
        expect(response.error.code).toBe(-32002);
        expect(response.error.message).toContain("Resource not found");
      } else {
        fail("Expected error, got result");
      }
    });

    it("reads a resource via template", async () => {
      server.addResource(
        "files",
        { template: "file:///example/{filename}" },
        { description: "Example files" },
        async (uri) => {
          const filename = uri.split("/").pop();
          return {
            contents: [
              {
                uri,
                mimeType: "text/plain",
                text: `Content of ${filename}`,
              },
            ],
          };
        }
      );

      const request = newJSONRPCRequest({
        id: 1,
        method: "resources/read",
        params: {
          uri: "file:///example/test.txt",
        },
      });

      const response = await server.handleRequest(request);

      expect(response).toBeDefined();
      if ("result" in response) {
        const result = response.result as ReadResourceResult;
        expect(result.contents).toHaveLength(1);
        if ("text" in result.contents[0]) {
          expect(result.contents[0].text).toBe("Content of test.txt");
        }
      } else {
        fail("Expected result, got error");
      }
    });
  });
});
