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
import { CompleteRequestSchema } from "./autocomplete.schema";
import { InitializeRequestSchema } from "./initialize.schema";
import { SetLevelRequestSchema } from "./logging.schema";
import {
  CancelledNotificationSchema,
  InitializedNotificationSchema,
  ProgressNotificationSchema,
} from "./notifications.schema";
import { PingRequestSchema } from "./ping.schema";
import {
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
} from "./prompt.schema";
import {
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
} from "./resource.schema";
import {
  ListRootsResultSchema,
  RootsListChangedNotificationSchema,
} from "./roots.schema";
import { CreateMessageResultSchema } from "./sampling.schema";
import { CallToolRequestSchema, ListToolsRequestSchema } from "./tools.schema";

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
