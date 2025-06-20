/*
 * Copyright (c) 2025 Zuplo
 * Copyright (c) 2024 Anthropic, PBC
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at:
 *
 *     https://mit-license.org/
 *
 * The following is a derivative work of github.com/modelcontextprotocol/typescript-sdk
 * and is attributed to the original authors under the License.
 */

import { z } from "zod/v4";
import { NotificationSchema } from "../../../../jsonrpc2/schemas/notifications.js";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../../jsonrpc2/schemas/response.js";
import { BaseMetadataSchema } from "./base.schema.js";
import {
  PaginatedRequestSchema,
  PaginatedResultSchema,
} from "./pagination.schema.js";

/**
 * Additional properties describing a Tool to clients.
 *
 * NOTE: all properties in ToolAnnotations are **hints**.
 * They are not guaranteed to provide a faithful description of
 * tool behavior (including descriptive properties like `title`).
 *
 * Clients should never make tool use decisions based on ToolAnnotations
 * received from untrusted servers.
 */
export const ToolAnnotationsSchema = z
  .object({
    /**
     * A human-readable title for the tool.
     */
    title: z.optional(z.string()),

    /**
     * If true, the tool does not modify its environment.
     *
     * Default: false
     */
    readOnlyHint: z.optional(z.boolean()),

    /**
     * If true, the tool may perform destructive updates to its environment.
     * If false, the tool performs only additive updates.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: true
     */
    destructiveHint: z.optional(z.boolean()),

    /**
     * If true, calling the tool repeatedly with the same arguments
     * will have no additional effect on the its environment.
     *
     * (This property is meaningful only when `readOnlyHint == false`)
     *
     * Default: false
     */
    idempotentHint: z.optional(z.boolean()),

    /**
     * If true, this tool may interact with an "open world" of external
     * entities. If false, the tool's domain of interaction is closed.
     * For example, the world of a web search tool is open, whereas that
     * of a memory tool is not.
     *
     * Default: true
     */
    openWorldHint: z.optional(z.boolean()),
  })
  .loose();

/**
 * Definition for a tool the client can call.
 */
export const ToolSchema = BaseMetadataSchema.extend({
  /**
   * A human-readable description of the tool.
   *
   * This can be used by clients to improve the LLM's understanding of available
   * tools. It can be thought of like a "hint" to the model.
   */
  description: z.optional(z.string()),

  /**
   * A JSON Schema object defining the expected parameters for the tool.
   */
  inputSchema: z
    .object({
      type: z.literal("object"),
      properties: z.optional(z.record(z.string(), z.object({}).loose())),
      required: z.optional(z.array(z.string())),
    })
    .loose(),

  /**
   * An optional JSON Schema object defining the structure of the tool's output returned in
   * the structuredContent field of a CallToolResult.
   */
  outputSchema: z.optional(
    z
      .object({
        type: z.literal("object"),
        properties: z.optional(z.record(z.string(), z.object({}).loose())),
        required: z.optional(z.array(z.string())),
      })
      .loose()
  ),

  /**
   * Optional additional tool information.
   *
   * Display name precedence order is: title, annotations.title, then name.
   */
  annotations: z.optional(ToolAnnotationsSchema),

  /**
   * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
   */
  _meta: z.optional(z.object({}).loose()),
});

/**
 * Sent from the client to request a list of tools the server has.
 */
export const ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("tools/list"),
});

/**
 * The server's response to a tools/list request from the client.
 */
export const ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: z.array(ToolSchema),
});

/**
 * Used by the client to invoke a tool provided by the server.
 */
export const CallToolRequestSchema = RequestSchema.extend({
  method: z.literal("tools/call"),
  params: BaseRequestParamsSchema.extend({
    name: z.string(),
    arguments: z.optional(z.record(z.string(), z.unknown())),
  }),
});

/**
 * The server's response to a tool call.
 */
export const CallToolResultSchema = z.lazy(() => {
  const {
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
    EmbeddedResourceSchema,
  } = require("./content.schema.js");
  const { ResourceLinkSchema } = require("./resource.schema.js");

  return ResultSchema.extend({
    /**
     * A list of content objects that represent the unstructured result of the tool call.
     */
    content: z.array(
      z.discriminatedUnion("type", [
        TextContentSchema,
        ImageContentSchema,
        AudioContentSchema,
        ResourceLinkSchema,
        EmbeddedResourceSchema,
      ])
    ),

    /**
     * An optional JSON object that represents the structured result of the tool call.
     */
    structuredContent: z.optional(z.record(z.string(), z.unknown())),

    /**
     * Whether the tool call ended in an error.
     *
     * If not set, this is assumed to be false (the call was successful).
     *
     * Any errors that originate from the tool SHOULD be reported inside the result
     * object, with `isError` set to true, _not_ as an MCP protocol-level error
     * response. Otherwise, the LLM would not be able to see that an error occurred
     * and self-correct.
     *
     * However, any errors in _finding_ the tool, an error indicating that the
     * server does not support tool calls, or any other exceptional conditions,
     * should be reported as an MCP error response.
     */
    isError: z.optional(z.boolean()),
  });
});

/**
 * An optional notification from the server to the client, informing it that
 * the list of tools it offers has changed. This may be issued by servers
 * without any previous subscription from the client.
 */
export const ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/tools/list_changed"),
});
