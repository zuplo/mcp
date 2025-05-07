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

import { z } from "zod";
import {
  PaginatedRequestSchema,
  PaginatedResultSchema,
} from "./pagination.schema";
import { ResultSchema } from "../../../../jsonrpc2/schemas/response";
import {
  AudioContentSchema,
  EmbeddedResourceSchema,
  ImageContentSchema,
  TextContentSchema,
} from "./content.schema";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../../jsonrpc2/schemas/request";
import { NotificationSchema } from "../../../../jsonrpc2/schemas/notifications";

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
  .passthrough();

/**
 * Definition for a tool the client can call.
 */
export const ToolSchema = z
  .object({
    /**
     * The name of the tool.
     */
    name: z.string(),

    /**
     * A human-readable description of the tool.
     */
    description: z.optional(z.string()),

    /**
     * A JSON Schema object defining the expected parameters for the tool.
     */
    inputSchema: z
      .object({
        type: z.literal("object"),
        properties: z.optional(z.object({}).passthrough()),
      })
      .passthrough(),

    /**
     * Optional additional tool information.
     */
    annotations: z.optional(ToolAnnotationsSchema),
  })
  .passthrough();

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
 * The server's response to a tool call.
 */
export const CallToolResultSchema = ResultSchema.extend({
  content: z.array(
    z.union([
      TextContentSchema,
      ImageContentSchema,
      AudioContentSchema,
      EmbeddedResourceSchema,
    ])
  ),
  isError: z.boolean().default(false).optional(),
});

/**
 * CallToolResultSchema extended with backwards compatibility to protocol
 * version 2024-10-07.
 */
export const CompatibilityCallToolResultSchema = CallToolResultSchema.or(
  ResultSchema.extend({
    toolResult: z.unknown(),
  })
);

/**
 * Used by the client to invoke a tool provided by the server.
 */
export const CallToolRequestSchema = RequestSchema.extend({
  method: z.literal("tools/call"),
  params: BaseRequestParamsSchema.extend({
    name: z.string(),
    arguments: z.optional(z.record(z.unknown())),
  }),
});

/**
 * An optional notification from the server to the client, informing it that the
 * list of tools it offers has changed. This may be issued by servers without
 * any previous subscription from the client.
 */
export const ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/tools/list_changed"),
});
