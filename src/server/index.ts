import { z } from "zod/v4";
import { ErrorCode } from "../jsonrpc2/consts.js";
import {
  type JSONRPCError,
  type JSONRPCMessage,
  type JSONRPCNotification,
  type JSONRPCRequest,
  type JSONRPCResponse,
  newJSONRPCError,
  newJSONRPCReponse,
} from "../jsonrpc2/types.js";
import {
  isJSONRPCNotification,
  isJSONRPCRequest,
  isJSONRPCResponse,
} from "../jsonrpc2/validation.js";
import { createDefaultLogger } from "../logger/index.js";
import type { Logger } from "../logger/types.js";
import { InitializeRequestSchema } from "../mcp/20250618/schemas/initialize.schema.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "../mcp/20250618/schemas/prompt.schema.js";
import {
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "../mcp/20250618/schemas/resource.schema.js";
import { CallToolRequestSchema } from "../mcp/20250618/schemas/tools.schema.js";
import type {
  CallToolResult,
  GetPromptResult,
  InitializeResult,
  ListPromptsResult,
  ListResourceTemplatesResult,
  ListResourcesResult,
  ListToolsResult,
  Prompt,
  PromptArgument,
  ServerCapabilities,
  Tool,
} from "../mcp/20250618/types.js";
import {
  LATEST_PROTOCOL_VERSION,
  PROTOCOL_VERSION_2024_10_07,
  PROTOCOL_VERSION_2024_11_05,
  PROTOCOL_VERSION_2025_03_26,
  SUPPORTED_PROTOCOL_VERSIONS,
} from "../mcp/versions.js";
import type { PromptConfig, RegisteredPrompt } from "../prompts/types.js";
import type {
  RegisteredResourceOrTemplate,
  ResourceMetadata,
  ResourceReader,
  URITemplate,
} from "../resources/types.js";
import type { ToolConfig } from "../tools/types.js";
import type { Transport } from "../transport/types.js";
import type {
  InputParamValidator,
  MCPServerOptions,
  RegisteredTool,
} from "./types.js";

export const DEFAULT_MCP_SERVER_NAME = "MCP Server";
export const DEFAULT_MCP_SERVER_VERSION = "0.0.0";

export class MCPServer {
  private capabilities: ServerCapabilities;
  private tools: Map<string, RegisteredTool> = new Map();
  private prompts: Map<string, RegisteredPrompt> = new Map();
  private resources: Map<string, RegisteredResourceOrTemplate> = new Map();
  private name: string;
  private version: string;
  private instructions: string | undefined;
  private logger: Logger;

  constructor(options: MCPServerOptions) {
    this.name = options.name || DEFAULT_MCP_SERVER_NAME;
    this.version = options.version || DEFAULT_MCP_SERVER_VERSION;
    this.instructions = options.instructions || undefined;
    this.logger = options.logger || createDefaultLogger();

    // Set default capabilities
    this.capabilities = {
      tools: {
        supported: true,
        available: [],
      },
      prompts: {},
      resources: {},
      ...options.capabilities,
    };
  }

  public withTransport(transport: Transport) {
    transport.onMessage(async (message): Promise<JSONRPCMessage | null> => {
      try {
        if (isJSONRPCRequest(message)) {
          const response = await this.handleRequest(message);
          if (response) {
            await transport.send(response);
            return response;
          }
        } else if (isJSONRPCNotification(message)) {
          await this.handleNotification(message);
          return null;
        } else if (isJSONRPCResponse(message)) {
          this.logger.debug("Received response:", message);
          return null;
        }
      } catch (error) {
        this.logger.error("Error processing message:", error);

        // Send error response for requests
        if (isJSONRPCRequest(message)) {
          const errorResponse = newJSONRPCError({
            id: message.id,
            code: ErrorCode.InternalError,
            message: error instanceof Error ? error.message : "Internal error",
          });

          await transport.send(errorResponse);
          return errorResponse;
        }
      }

      return null;
    });
  }

  getTool(name: string): Tool | undefined {
    const registeredTool = this.tools.get(name);
    return registeredTool?.tool;
  }

  getTools(): Map<string, Tool> {
    const toolsMap = new Map<string, Tool>();
    for (const [name, registeredTool] of this.tools.entries()) {
      toolsMap.set(name, registeredTool.tool);
    }
    return toolsMap;
  }

  /**
   * Get the server capabilities
   */
  public getCapabilities(): ServerCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Register a tool
   */
  public addTool<
    V extends InputParamValidator<unknown>,
    R extends CallToolResult = CallToolResult,
  >(config: ToolConfig<V, R>): void {
    const {
      name,
      validator,
      handler,
      description = `Execute the ${name} tool`,
      outputSchema,
      annotations,
      _meta,
    } = config;

    const toolSchema: Tool = {
      name,
      description,
      inputSchema: validator.jsonSchema as Tool["inputSchema"],
      ...(outputSchema && { outputSchema }),
      ...(annotations && { annotations }),
      ...(_meta && { _meta }),
    };

    const registered: RegisteredTool = {
      tool: toolSchema,
      validator,
      handler,
    };

    this.tools.set(name, registered);
    this.updateAvailableTools();
  }

  /**
   * Remove a tool from the server
   */
  public removeTool(name: string): boolean {
    const result = this.tools.delete(name);

    if (result) {
      this.updateAvailableTools();
    }

    return result;
  }

  /**
   * Get all registered tools
   */
  public getToolDefinitions(): Tool[] {
    return Array.from(this.tools.values()).map((tool) => tool.tool);
  }

  /**
   * Register a prompt
   */
  public addPrompt<V extends InputParamValidator<unknown>>(
    config: PromptConfig<V>
  ): void {
    const { name, validator, generator, description } = config;

    // Extract "arguments" from the validator's JSON schema
    // be be used as the broadcasted arguments
    const jsonSchema = validator.jsonSchema as Tool["inputSchema"];
    let promptArguments: PromptArgument[] | undefined;

    if (jsonSchema.properties && typeof jsonSchema.properties === "object") {
      const requiredFields = new Set(jsonSchema.required || []);
      promptArguments = Object.entries(jsonSchema.properties).map(
        ([propName, propSchema]: [string, { description?: string }]) => ({
          name: propName,
          description: propSchema.description ?? `Prompt for ${propName}`,
          required: requiredFields.has(propName),
        })
      );
    }

    const promptSchema: Prompt = {
      name,
      description,
      ...(promptArguments && { arguments: promptArguments }),
    };

    const registered: RegisteredPrompt = {
      prompt: promptSchema,
      validator,
      generator,
    };

    this.prompts.set(name, registered);
  }

  /**
   * Remove a prompt from the server
   */
  public removePrompt(name: string): boolean {
    return this.prompts.delete(name);
  }

  /**
   * Get a specific prompt by name
   */
  public getPrompt(name: string): Prompt | undefined {
    const registeredPrompt = this.prompts.get(name);
    return registeredPrompt?.prompt;
  }

  /**
   * Get all registered prompts
   */
  public getPromptDefinitions(): Prompt[] {
    return Array.from(this.prompts.values()).map((prompt) => prompt.prompt);
  }

  /**
   * Add a resource to the server
   */
  public addResource(
    name: string,
    uri: string | URITemplate,
    metadata: ResourceMetadata,
    reader: ResourceReader
  ): void {
    if (typeof uri === "string") {
      const resource = {
        name,
        uri,
        ...metadata,
      };

      const registered: RegisteredResourceOrTemplate = {
        type: "resource",
        resource,
        reader,
      };

      this.resources.set(name, registered);
    } else {
      const template = {
        name,
        uriTemplate: uri.template,
        ...metadata,
      };

      const registered: RegisteredResourceOrTemplate = {
        type: "template",
        template,
        reader,
      };

      this.resources.set(name, registered);
    }
  }

  /**
   * Remove a resource from the server
   */
  public removeResource(name: string): boolean {
    return this.resources.delete(name);
  }

  /**
   * Get a specific resource by name
   */
  public getResource(name: string) {
    const registered = this.resources.get(name);
    if (!registered) return undefined;
    return registered.type === "resource" ? registered.resource : undefined;
  }

  /**
   * Get a specific resource template by name
   */
  public getResourceTemplate(name: string) {
    const registered = this.resources.get(name);
    if (!registered) return undefined;
    return registered.type === "template" ? registered.template : undefined;
  }

  /**
   * Get all registered resources (non-templates)
   */
  public getResourceDefinitions() {
    return Array.from(this.resources.values())
      .filter((r) => r.type === "resource")
      .map((r) => r.resource);
  }

  /**
   * Get all registered resource templates
   */
  public getResourceTemplateDefinitions() {
    return Array.from(this.resources.values())
      .filter((r) => r.type === "template")
      .map((r) => r.template);
  }

  /**
   * Handle a JSON-RPC request
   */
  public async handleRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    try {
      switch (request.method) {
        case "ping":
          return this.handlePing(request);
        case "initialize":
          return this.handleInitialize(request);
        case "tools/list":
          return this.handleToolListRequest(request);
        case "tools/call":
          return this.handleToolCallRequest(request);
        case "prompts/list":
          return this.handlePromptListRequest(request);
        case "prompts/get":
          return this.handlePromptGetRequest(request);
        case "resources/list":
          return this.handleResourceListRequest(request);
        case "resources/templates/list":
          return this.handleResourceTemplateListRequest(request);
        case "resources/read":
          return this.handleResourceReadRequest(request);
        default:
          // Method not found
          return newJSONRPCError({
            id: request.id,
            code: ErrorCode.MethodNotFound,
            message: `Method "${request.method}" not found`,
          });
      }
    } catch (error) {
      this.logger.error("Error handling request:", error);

      // Internal error
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InternalError,
        message: error instanceof Error ? error.message : "Internal error",
      });
    }
  }

  /**
   * Handle a JSON-RPC notification
   */
  public async handleNotification(
    notification: JSONRPCNotification
  ): Promise<void> {
    this.logger.debug("Received notification:", notification.method);
  }

  /**
   * Handle ping request - the server MUST respond with an empty request.
   */
  private handlePing(request: JSONRPCRequest): JSONRPCResponse | JSONRPCError {
    return newJSONRPCReponse({ id: request.id, result: {} });
  }

  /**
   * Handle initialize request
   */
  private handleInitialize(
    request: JSONRPCRequest
  ): JSONRPCResponse | JSONRPCError {
    const parseResult = InitializeRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);

      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const protocolVersion = parseResult.data.params.protocolVersion;

    switch (protocolVersion) {
      case LATEST_PROTOCOL_VERSION:
      case PROTOCOL_VERSION_2025_03_26:
      case PROTOCOL_VERSION_2024_11_05:
      case PROTOCOL_VERSION_2024_10_07: {
        const initResponse: InitializeResult = {
          protocolVersion: protocolVersion,
          capabilities: this.getCapabilities(),
          serverInfo: {
            name: this.name,
            version: this.version,
          },
          ...(this.instructions ? { instructions: this.instructions } : {}),
        };

        return newJSONRPCReponse({ id: request.id, result: initResponse });
      }
      default: {
        return newJSONRPCError({
          id: request.id,
          code: ErrorCode.InvalidParams,
          message: `Unsupported protocol version: ${protocolVersion} - supported versions: ${SUPPORTED_PROTOCOL_VERSIONS}`,
          data: {
            supportedVersions: SUPPORTED_PROTOCOL_VERSIONS,
          },
        });
      }
    }
  }

  private async handleToolListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    // Map over the tools Map to create an array of Tool objects
    const toolsArray = Array.from(this.tools.entries()).map(
      ([name, registeredTool]) => {
        // Extract the toolSchema which already has the correct structure
        return registeredTool.tool;
      }
    );

    const toolList: ListToolsResult = {
      tools: toolsArray,
    };

    return newJSONRPCReponse({
      id: request.id,
      result: toolList,
    });
  }

  /**
   * Handle tool request
   */
  private async handleToolCallRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const validatedToolCall = CallToolRequestSchema.safeParse(request);
    if (!validatedToolCall.success) {
      this.logger.warn(
        "Could not validate tool call:",
        validatedToolCall.error
      );

      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidRequest,
        message: `Invalid request ${validatedToolCall.error}`,
      });
    }

    const toolCallReq = validatedToolCall.data;
    const toolName = toolCallReq.params.name;

    const tool = this.tools.get(toolName);
    if (!tool) {
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Tool "${toolName}" not found`,
      });
    }

    const rawArgs = toolCallReq.params.arguments ?? {};
    const validation = tool.validator.parse(rawArgs);
    if (!validation.success) {
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: validation.errorMessage
          ? `Invalid arguments for tool '${toolName}': ${validation.errorMessage}`
          : `Invalid arguments for tool '${toolName}'`,
        data: validation.errorData,
      });
    }

    // Execute the tool
    try {
      // upcast here since we are sure that the json schema object has been
      // validated and "data" should be some sort of object.
      const data = validation.data as object;
      const result = await tool.handler(data, toolCallReq.params._meta);

      return newJSONRPCReponse({
        id: request.id,
        result: result,
      });
    } catch (error) {
      this.logger.error(`Error executing tool "${toolName}":`, error);

      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InternalError,
        message:
          error instanceof Error ? error.message : "Tool execution error",
      });
    }
  }

  /**
   * Handle prompts/list request
   */
  private async handlePromptListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = ListPromptsRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const promptsArray = Array.from(this.prompts.values()).map(
      (registeredPrompt) => registeredPrompt.prompt
    );

    const result: ListPromptsResult = {
      prompts: promptsArray,
    };

    return newJSONRPCReponse({
      id: request.id,
      result,
    });
  }

  /**
   * Handle prompts/get request
   */
  private async handlePromptGetRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = GetPromptRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const promptName = parseResult.data.params.name;
    const prompt = this.prompts.get(promptName);

    if (!prompt) {
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Prompt "${promptName}" not found`,
      });
    }

    const rawArgs = parseResult.data.params.arguments ?? {};
    const validation = prompt.validator.parse(rawArgs);

    if (!validation.success) {
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: validation.errorMessage
          ? `Invalid arguments for prompt '${promptName}': ${validation.errorMessage}`
          : `Invalid arguments for prompt '${promptName}'`,
        data: validation.errorData,
      });
    }

    try {
      const data = validation.data as object;
      const messages = await prompt.generator(data);

      const result: GetPromptResult = {
        ...(prompt.prompt.description && {
          description: prompt.prompt.description,
        }),
        messages,
      };

      return newJSONRPCReponse({
        id: request.id,
        result,
      });
    } catch (error) {
      this.logger.error(`Error generating prompt "${promptName}":`, error);

      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InternalError,
        message:
          error instanceof Error ? error.message : "Prompt generation error",
      });
    }
  }

  /**
   * Update the available tools in capabilities
   */
  private updateAvailableTools(): void {
    if (this.capabilities.tools) {
      this.capabilities.tools.available = Array.from(this.tools.keys());
    }
  }

  /**
   * Handle resources/list request
   */
  private async handleResourceListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = ListResourcesRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const resourcesArray = Array.from(this.resources.values())
      .filter((r) => r.type === "resource")
      .map((r) => r.resource);

    const result: ListResourcesResult = {
      resources: resourcesArray,
    };

    return newJSONRPCReponse({
      id: request.id,
      result,
    });
  }

  /**
   * Handle resources/templates/list request
   */
  private async handleResourceTemplateListRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = ListResourceTemplatesRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const templatesArray = Array.from(this.resources.values())
      .filter((r) => r.type === "template")
      .map((r) => r.template);

    const result: ListResourceTemplatesResult = {
      resourceTemplates: templatesArray,
    };

    return newJSONRPCReponse({
      id: request.id,
      result,
    });
  }

  /**
   * Handle resources/read request
   */
  private async handleResourceReadRequest(
    request: JSONRPCRequest
  ): Promise<JSONRPCResponse | JSONRPCError> {
    const parseResult = ReadResourceRequestSchema.safeParse(request);

    if (!parseResult.success) {
      const treeErrors = z.treeifyError(parseResult.error);
      const prettyErrors = z.prettifyError(parseResult.error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.InvalidParams,
        message: `Invalid request parameters: ${prettyErrors}`,
        data: treeErrors,
      });
    }

    const uri = parseResult.data.params.uri;

    function matchesTemplate(uri: string, template: string): boolean {
      // matches URI {variable} directly via regex
      const regexPattern = template.replace(/\{[^}]+\}/g, "([^/]+)");
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(uri);
    }

    const resourceOrTemplate = Array.from(this.resources.values()).find(
      (r) =>
        (r.type === "resource" && r.resource.uri === uri) ||
        (r.type === "template" && matchesTemplate(uri, r.template.uriTemplate))
    );

    if (!resourceOrTemplate) {
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.ResourceNotFound,
        message: `Resource not found: ${uri}`,
        data: { uri },
      });
    }

    try {
      const result = await resourceOrTemplate.reader(uri);
      return newJSONRPCReponse({
        id: request.id,
        result,
      });
    } catch (error) {
      this.logger.error(`Error reading resource "${uri}":`, error);
      return newJSONRPCError({
        id: request.id,
        code: ErrorCode.ResourceNotFound,
        message: error instanceof Error ? error.message : "Resource not found",
        data: { uri },
      });
    }
  }
}
