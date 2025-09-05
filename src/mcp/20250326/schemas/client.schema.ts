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
import { EmptyResultSchema } from "./../../../jsonrpc2/schemas/response.js";
import { CompleteRequestSchema } from "./autocomplete.schema.js";
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
import {
  ListRootsResultSchema,
  RootsListChangedNotificationSchema,
} from "./roots.schema.js";
import { CreateMessageResultSchema } from "./sampling.schema.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "./tools.schema.js";

/**
 * Client requests union
 */
export const ClientRequestSchema = z.union([
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

/**
 * Client notifications union
 */
export const ClientNotificationSchema = z.union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
]);

/**
 * Client results union
 */
export const ClientResultSchema = z.union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  ListRootsResultSchema,
]);
