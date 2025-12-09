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
import { EmptyResultSchema } from "../../../jsonrpc2/schemas/response.js";
import { CompleteResultSchema } from "./autocomplete.schema.js";
import {
  ElicitRequestSchema,
  ElicitationCompleteNotificationSchema,
} from "./elicitation.schema.js";
import { InitializeResultSchema } from "./initialize.schema.js";
import { LoggingMessageNotificationSchema } from "./logging.schema.js";
import {
  CancelledNotificationSchema,
  ProgressNotificationSchema,
} from "./notifications.schema.js";
import { PingRequestSchema } from "./ping.schema.js";
import {
  GetPromptResultSchema,
  ListPromptsResultSchema,
  PromptListChangedNotificationSchema,
} from "./prompt.schema.js";
import {
  ListResourceTemplatesResultSchema,
  ListResourcesResultSchema,
  ReadResourceResultSchema,
  ResourceListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
} from "./resource.schema.js";
import { ListRootsRequestSchema } from "./roots.schema.js";
import { CreateMessageRequestSchema } from "./sampling.schema.js";
import {
  CancelTaskRequestSchema,
  CancelTaskResultSchema,
  GetTaskPayloadRequestSchema,
  GetTaskPayloadResultSchema,
  GetTaskRequestSchema,
  GetTaskResultSchema,
  ListTasksRequestSchema,
  ListTasksResultSchema,
  TaskStatusNotificationSchema,
} from "./tasks.schema.js";
import {
  CallToolResultSchema,
  ListToolsResultSchema,
  ToolListChangedNotificationSchema,
} from "./tools.schema.js";

export const ServerRequestSchema = z.discriminatedUnion("method", [
  PingRequestSchema,
  CreateMessageRequestSchema,
  ListRootsRequestSchema,
  ElicitRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema,
]);

export const ServerNotificationSchema = z.discriminatedUnion("method", [
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  ElicitationCompleteNotificationSchema,
  TaskStatusNotificationSchema,
]);

export const ServerResultSchema = z.union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourceTemplatesResultSchema,
  ListResourcesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  GetTaskPayloadResultSchema,
  ListTasksResultSchema,
  CancelTaskResultSchema,
]);
