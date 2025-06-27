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

import { InitializeRequestSchema } from "./schemas/initialize.schema.js";
import { InitializedNotificationSchema } from "./schemas/notifications.schema.js";
import type { InitializeRequest, InitializedNotification } from "./types.js";

export const isInitializeRequest = (
  value: unknown
): value is InitializeRequest =>
  InitializeRequestSchema.safeParse(value).success;

export const isInitializedNotification = (
  value: unknown
): value is InitializedNotification =>
  InitializedNotificationSchema.safeParse(value).success;
