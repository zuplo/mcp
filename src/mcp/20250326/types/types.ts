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

import type { z } from "zod/v4";

import type { EmptyResultSchema } from "../../../jsonrpc2/schemas/response.js";
import type {
  CompleteRequestSchema,
  CompleteResultSchema,
  PromptReferenceSchema,
  ResourceReferenceSchema,
} from "./schemas/autocomplete.schema.js";
import type {
  ClientCapabilitiesSchema,
  ServerCapabilitiesSchema,
} from "./schemas/capabilities.schema.js";
import type {
  ClientNotificationSchema,
  ClientRequestSchema,
  ClientResultSchema,
} from "./schemas/client.schema.js";
import type {
  AudioContentSchema,
  EmbeddedResourceSchema,
  ImageContentSchema,
  TextContentSchema,
} from "./schemas/content.schema.js";
import type { ImplementationSchema } from "./schemas/implementation.schema.js";
import type {
  InitializeRequestSchema,
  InitializeResultSchema,
} from "./schemas/initialize.schema.js";
import type {
  LoggingLevelSchema,
  LoggingMessageNotificationSchema,
  SetLevelRequestSchema,
} from "./schemas/logging.schema.js";
import type {
  CancelledNotificationSchema,
  InitializedNotificationSchema,
  ProgressNotificationSchema,
} from "./schemas/notifications.schema.js";
import type {
  PaginatedRequestSchema,
  PaginatedResultSchema,
} from "./schemas/pagination.schema.js";
import type { PingRequestSchema } from "./schemas/ping.schema.js";
import type { ProgressSchema } from "./schemas/progress.schema.js";
import type {
  GetPromptRequestSchema,
  GetPromptResultSchema,
  ListPromptsRequestSchema,
  ListPromptsResultSchema,
  PromptArgumentSchema,
  PromptListChangedNotificationSchema,
  PromptMessageSchema,
  PromptSchema,
} from "./schemas/prompt.schema.js";
import type {
  BlobResourceContentsSchema,
  ListResourceTemplatesRequestSchema,
  ListResourceTemplatesResultSchema,
  ListResourcesRequestSchema,
  ListResourcesResultSchema,
  ReadResourceRequestSchema,
  ReadResourceResultSchema,
  ResourceContentsSchema,
  ResourceListChangedNotificationSchema,
  ResourceSchema,
  ResourceTemplateSchema,
  ResourceUpdatedNotificationSchema,
  SubscribeRequestSchema,
  TextResourceContentsSchema,
  UnsubscribeRequestSchema,
} from "./schemas/resource.schema.js";
import type {
  ListRootsRequestSchema,
  ListRootsResultSchema,
  RootSchema,
  RootsListChangedNotificationSchema,
} from "./schemas/roots.schema.js";
import type {
  CreateMessageRequestSchema,
  CreateMessageResultSchema,
  SamplingMessageSchema,
} from "./schemas/sampling.schema.js";
import type {
  ServerNotificationSchema,
  ServerRequestSchema,
  ServerResultSchema,
} from "./schemas/server.schema.js";
import type {
  CallToolRequestSchema,
  CallToolResultSchema,
  CompatibilityCallToolResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
  ToolAnnotationsSchema,
  ToolListChangedNotificationSchema,
  ToolSchema,
} from "./schemas/tools.schema.js";

/* Initialization */
export type Implementation = z.infer<typeof ImplementationSchema>;
export type ClientCapabilities = z.infer<typeof ClientCapabilitiesSchema>;
export type InitializeRequest = z.infer<typeof InitializeRequestSchema>;
export type ServerCapabilities = z.infer<typeof ServerCapabilitiesSchema>;
export type InitializeResult = z.infer<typeof InitializeResultSchema>;
export type InitializedNotification = z.infer<
  typeof InitializedNotificationSchema
>;

/* Empty result */
export type EmptyResult = z.infer<typeof EmptyResultSchema>;

/* Cancellation */
export type CancelledNotification = z.infer<typeof CancelledNotificationSchema>;

/* Ping */
export type PingRequest = z.infer<typeof PingRequestSchema>;

/* Progress notifications */
export type Progress = z.infer<typeof ProgressSchema>;
export type ProgressNotification = z.infer<typeof ProgressNotificationSchema>;

/* Pagination */
export type PaginatedRequest = z.infer<typeof PaginatedRequestSchema>;
export type PaginatedResult = z.infer<typeof PaginatedResultSchema>;

/* Resources */
export type ResourceContents = z.infer<typeof ResourceContentsSchema>;
export type TextResourceContents = z.infer<typeof TextResourceContentsSchema>;
export type BlobResourceContents = z.infer<typeof BlobResourceContentsSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceTemplate = z.infer<typeof ResourceTemplateSchema>;
export type ListResourcesRequest = z.infer<typeof ListResourcesRequestSchema>;
export type ListResourcesResult = z.infer<typeof ListResourcesResultSchema>;
export type ListResourceTemplatesRequest = z.infer<
  typeof ListResourceTemplatesRequestSchema
>;
export type ListResourceTemplatesResult = z.infer<
  typeof ListResourceTemplatesResultSchema
>;
export type ReadResourceRequest = z.infer<typeof ReadResourceRequestSchema>;
export type ReadResourceResult = z.infer<typeof ReadResourceResultSchema>;
export type ResourceListChangedNotification = z.infer<
  typeof ResourceListChangedNotificationSchema
>;
export type SubscribeRequest = z.infer<typeof SubscribeRequestSchema>;
export type UnsubscribeRequest = z.infer<typeof UnsubscribeRequestSchema>;
export type ResourceUpdatedNotification = z.infer<
  typeof ResourceUpdatedNotificationSchema
>;

/* Prompts */
export type PromptArgument = z.infer<typeof PromptArgumentSchema>;
export type Prompt = z.infer<typeof PromptSchema>;
export type ListPromptsRequest = z.infer<typeof ListPromptsRequestSchema>;
export type ListPromptsResult = z.infer<typeof ListPromptsResultSchema>;
export type GetPromptRequest = z.infer<typeof GetPromptRequestSchema>;
export type TextContent = z.infer<typeof TextContentSchema>;
export type ImageContent = z.infer<typeof ImageContentSchema>;
export type AudioContent = z.infer<typeof AudioContentSchema>;
export type EmbeddedResource = z.infer<typeof EmbeddedResourceSchema>;
export type PromptMessage = z.infer<typeof PromptMessageSchema>;
export type GetPromptResult = z.infer<typeof GetPromptResultSchema>;
export type PromptListChangedNotification = z.infer<
  typeof PromptListChangedNotificationSchema
>;

/* Tools */
export type ToolAnnotations = z.infer<typeof ToolAnnotationsSchema>;
export type Tool = z.infer<typeof ToolSchema>;
export type ListToolsRequest = z.infer<typeof ListToolsRequestSchema>;
export type ListToolsResult = z.infer<typeof ListToolsResultSchema>;
export type CallToolResult = z.infer<typeof CallToolResultSchema>;
export type CompatibilityCallToolResult = z.infer<
  typeof CompatibilityCallToolResultSchema
>;
export type CallToolRequest = z.infer<typeof CallToolRequestSchema>;
export type ToolListChangedNotification = z.infer<
  typeof ToolListChangedNotificationSchema
>;

/* Logging */
export type LoggingLevel = z.infer<typeof LoggingLevelSchema>;
export type SetLevelRequest = z.infer<typeof SetLevelRequestSchema>;
export type LoggingMessageNotification = z.infer<
  typeof LoggingMessageNotificationSchema
>;

/* Sampling */
export type SamplingMessage = z.infer<typeof SamplingMessageSchema>;
export type CreateMessageRequest = z.infer<typeof CreateMessageRequestSchema>;
export type CreateMessageResult = z.infer<typeof CreateMessageResultSchema>;

/* Autocomplete */
export type ResourceReference = z.infer<typeof ResourceReferenceSchema>;
export type PromptReference = z.infer<typeof PromptReferenceSchema>;
export type CompleteRequest = z.infer<typeof CompleteRequestSchema>;
export type CompleteResult = z.infer<typeof CompleteResultSchema>;

/* Roots */
export type Root = z.infer<typeof RootSchema>;
export type ListRootsRequest = z.infer<typeof ListRootsRequestSchema>;
export type ListRootsResult = z.infer<typeof ListRootsResultSchema>;
export type RootsListChangedNotification = z.infer<
  typeof RootsListChangedNotificationSchema
>;

/* Client messages */
export type ClientRequest = z.infer<typeof ClientRequestSchema>;
export type ClientNotification = z.infer<typeof ClientNotificationSchema>;
export type ClientResult = z.infer<typeof ClientResultSchema>;

/* Server messages */
export type ServerRequest = z.infer<typeof ServerRequestSchema>;
export type ServerNotification = z.infer<typeof ServerNotificationSchema>;
export type ServerResult = z.infer<typeof ServerResultSchema>;
