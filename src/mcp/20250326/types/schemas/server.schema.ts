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
import { PingRequestSchema } from "./ping.schema";
import { CreateMessageRequestSchema } from "./sampling.schema";
import { ListRootsRequestSchema } from "./roots.schema";
import {
  CancelledNotificationSchema,
  ProgressNotificationSchema,
} from "./notifications.schema";
import { LoggingMessageNotificationSchema } from "./logging.schema";
import {
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  ResourceListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
} from "./resource.schema";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
  ToolListChangedNotificationSchema,
} from "./tools.schema";
import {
  GetPromptResultSchema,
  ListPromptsResultSchema,
  PromptListChangedNotificationSchema,
} from "./prompt.schema";
import { EmptyResultSchema } from "../../../../jsonrpc2/schemas/response";
import { CompleteResultSchema } from "./autocomplete.schema";
import { InitializeResultSchema } from "./initialize.schema";

/**
 * Server request unions
 */
export const ServerRequestSchema = z.union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema,
]);

/**
 * Server notification unions
 */
export const ServerNotificationSchema = z.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
]);

/**
 * Server result unions
 */
export const ServerResultSchema = z.union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
]);
