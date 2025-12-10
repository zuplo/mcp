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
import { NotificationSchema } from "../../../jsonrpc2/schemas/notifications.js";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";
import {
  AnnotationsSchema,
  BaseMetadataSchema,
  IconsSchema,
} from "./base.schema.js";
import {
  PaginatedRequestSchema,
  PaginatedResultSchema,
} from "./pagination.schema.js";

/**
 * The contents of a specific resource or sub-resource.
 */
export const ResourceContentsSchema = z
  .object({
    /**
     * The URI of this resource.
     */
    uri: z.url(),
    /**
     * The MIME type of this resource, if known.
     */
    mimeType: z.optional(z.string()),

    /**
     * See [specification/2025-11-25/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).loose()),
  })
  .loose();

export const TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be
   * represented as text (not binary data).
   */
  text: z.string(),
});

export const BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: z.base64(),
});

/**
 * A known resource that the server is capable of reading.
 */
export const ResourceSchema = BaseMetadataSchema.merge(IconsSchema).extend({
  /**
   * The URI of this resource.
   */
  uri: z.url(),

  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available
   * resources. It can be thought of like a "hint" to the model.
   */
  description: z.optional(z.string()),

  /**
   * The MIME type of this resource, if known.
   */
  mimeType: z.optional(z.string()),

  /**
   * Optional annotations for the client.
   */
  annotations: z.optional(AnnotationsSchema),

  /**
   * The size of the raw resource content, in bytes (i.e., before base64
   * encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: z.optional(z.number()),

  /**
   * See [specification/2025-11-25/basic/index#general-fields] for notes on _meta usage.
   */
  _meta: z.optional(z.object({}).loose()),
});

/**
 * A resource that the server is capable of reading, included in a prompt or
 * tool call result.
 *
 * Note: resource links returned by tools are not guaranteed to appear in the
 * results of `resources/list` requests.
 */
export const ResourceLinkSchema = ResourceSchema.extend({
  type: z.literal("resource_link"),
});

/**
 * A template description for resources available on the server.
 */
export const ResourceTemplateSchema = BaseMetadataSchema.merge(
  IconsSchema
).extend({
  /**
   * A URI template (according to RFC 6570) that can be used to construct
   * resource URIs.
   */
  uriTemplate: z.string(),

  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available
   * resources. It can be thought of like a "hint" to the model.
   */
  description: z.optional(z.string()),

  /**
   * The MIME type for all resources that match this template. This should only
   * be included if all resources matching this template have the same type.
   */
  mimeType: z.optional(z.string()),

  /**
   * Optional annotations for the client.
   */
  annotations: z.optional(AnnotationsSchema),

  /**
   * See [specification/2025-11-25/basic/index#general-fields] for notes on _meta usage.
   */
  _meta: z.optional(z.object({}).loose()),
});

/**
 * Sent from the client to request a list of resources the server has.
 */
export const ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("resources/list"),
});

/**
 * The server's response to a resources/list request from the client.
 */
export const ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: z.array(ResourceSchema),
});

/**
 * Sent from the client to request a list of resource templates the server has.
 */
export const ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend(
  {
    method: z.literal("resources/templates/list"),
  }
);

/**
 * The server's response to a resources/templates/list request from the client.
 */
export const ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: z.array(ResourceTemplateSchema),
});

/**
 * Sent from the client to the server, to read a specific resource URI.
 */
export const ReadResourceRequestSchema = RequestSchema.extend({
  method: z.literal("resources/read"),
  params: BaseRequestParamsSchema.extend({
    /**
     * The URI of the resource to read. The URI can use any protocol; it is up
     * to the server how to interpret it.
     */
    uri: z.url(),
  }),
});

/**
 * The server's response to a resources/read request from the client.
 */
export const ReadResourceResultSchema = ResultSchema.extend({
  contents: z.array(
    z.union([TextResourceContentsSchema, BlobResourceContentsSchema])
  ),
});

/**
 * Sent from the client to request resources/updated notifications from the
 * server whenever a particular resource changes.
 */
export const SubscribeRequestSchema = RequestSchema.extend({
  method: z.literal("resources/subscribe"),
  params: BaseRequestParamsSchema.extend({
    /**
     * The URI of the resource to subscribe to. The URI can use any protocol;
     * it is up to the server how to interpret it.
     */
    uri: z.url(),
  }),
});

/**
 * Sent from the client to request cancellation of resources/updated notifications
 * from the server. This should follow a previous resources/subscribe request.
 */
export const UnsubscribeRequestSchema = RequestSchema.extend({
  method: z.literal("resources/unsubscribe"),
  params: BaseRequestParamsSchema.extend({
    /**
     * The URI of the resource to unsubscribe from.
     */
    uri: z.url(),
  }),
});

/**
 * An optional notification from the server to the client, informing it that the
 * list of resources it can read from has changed. This may be issued by servers
 * without any previous subscription from the client.
 */
export const ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/resources/list_changed"),
});

/**
 * A notification from the server to the client, informing it that a resource
 * has changed and may need to be read again. This should only be sent if the
 * client previously sent a resources/subscribe request.
 */
export const ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/resources/updated"),
  params: z
    .object({
      /**
       * The URI of the resource that has been updated. This might be a
       * sub-resource of the one that the client actually subscribed to.
       */
      uri: z.url(),
    })
    .loose(),
});
