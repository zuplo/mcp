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
import { CompleteRequestSchema } from "./autocomplete.schema.js";
import { ElicitResultSchema } from "./elicitation.schema.js";
import { InitializeRequestSchema } from "./initialize.schema.js";
import { SetLevelRequestSchema } from "./logging.schema.js";
import {
  CancelledNotificationSchema,
  InitializedNotificationSchema,
  ProgressNotificationSchema,
} from "./notifications.schema.js";
import { PingRequestSchema } from "./ping.schema.js";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "./prompt.schema.js";
import {
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from "./resource.schema.js";
import { RootsListChangedNotificationSchema } from "./roots.schema.js";
import { ListRootsResultSchema } from "./roots.schema.js";
import { CreateMessageResultSchema } from "./sampling.schema.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "./tools.schema.js";

export const ClientRequestSchema = z.discriminatedUnion("method", [
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
]);

export const ClientNotificationSchema = z.discriminatedUnion("method", [
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
]);

export const ClientResultSchema = z.union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  ListRootsResultSchema,
  ElicitResultSchema,
]);
