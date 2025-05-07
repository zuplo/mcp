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
  JSONRPCRequestSchema,
  ProgressTokenSchema,
  RequestMetaSchema,
  RequestSchema,
} from "./schemas/request";
import {
  JSONRPCNotificationSchema,
  NotificationSchema,
} from "./schemas/notifications";
import { JSONRPCResponseSchema, ResultSchema } from "./schemas/response";
import { JSONRPCErrorSchema } from "./schemas/error";
import { JSONRPCMessageSchema } from "./schemas/message";
import { CursorSchema } from "./schemas/cursor";
import { IdSchema } from "./schemas/id";

/* JSON-RPC core types */
export type ProgressToken = z.infer<typeof ProgressTokenSchema>;
export type Cursor = z.infer<typeof CursorSchema>;
export type Request = z.infer<typeof RequestSchema>;
export type RequestMeta = z.infer<typeof RequestMetaSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Result = z.infer<typeof ResultSchema>;

/* JSON-RPC messaging types */
export type JSONRPCId = z.infer<typeof IdSchema>;
export type JSONRPCRequest = z.infer<typeof JSONRPCRequestSchema>;
export type JSONRPCNotification = z.infer<typeof JSONRPCNotificationSchema>;
export type JSONRPCResponse = z.infer<typeof JSONRPCResponseSchema>;
export type JSONRPCError = z.infer<typeof JSONRPCErrorSchema>;
export type JSONRPCMessage = z.infer<typeof JSONRPCMessageSchema>;
