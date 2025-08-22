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
import { type ErrorCode, JSONRPC_VERSION } from "./consts.js";
import type { CursorSchema } from "./schemas/cursor.js";
import type { JSONRPCErrorSchema } from "./schemas/error.js";
import type { ErrorIdSchema, IdSchema } from "./schemas/id.js";
import type { JSONRPCMessageSchema } from "./schemas/message.js";
import type {
  JSONRPCNotificationSchema,
  NotificationSchema,
} from "./schemas/notifications.js";
import type {
  BaseRequestParamsSchema,
  JSONRPCRequestSchema,
  ProgressTokenSchema,
  RequestMetaSchema,
  RequestSchema,
} from "./schemas/request.js";
import type {
  JSONRPCResponseSchema,
  ResultSchema,
} from "./schemas/response.js";

/* JSON-RPC core types */
export type ProgressToken = z.infer<typeof ProgressTokenSchema>;
export type Cursor = z.infer<typeof CursorSchema>;
export type Request = z.infer<typeof RequestSchema>;
export type BaseRequestParams = z.infer<typeof BaseRequestParamsSchema>;
export type RequestMeta = z.infer<typeof RequestMetaSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type Result = z.infer<typeof ResultSchema>;

/* JSON-RPC messaging types */
export type JSONRPCId = z.infer<typeof IdSchema>;
export type JSONRPCErrorId = z.infer<typeof ErrorIdSchema>;
export type JSONRPCRequest = z.infer<typeof JSONRPCRequestSchema>;
export type JSONRPCNotification = z.infer<typeof JSONRPCNotificationSchema>;
export type JSONRPCResponse = z.infer<typeof JSONRPCResponseSchema>;
export type JSONRPCError = z.infer<typeof JSONRPCErrorSchema>;
export type JSONRPCMessage = z.infer<typeof JSONRPCMessageSchema>;

export function newJSONRPCRequest({
  id,
  method,
  params,
}: {
  id: JSONRPCId;
  method: string;
  params?: BaseRequestParams;
}): JSONRPCRequest {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    method,
    params,
  };
}

export function newJSONRPCReponse({
  id,
  result,
}: { id: JSONRPCId; result: Result }): JSONRPCResponse {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    result,
  };
}

export function newJSONRPCError({
  id,
  code,
  message,
  data,
}: {
  id: JSONRPCErrorId;
  code: ErrorCode;
  message: string;
  data?: unknown;
}): JSONRPCError {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: {
      code,
      message,
      data,
    },
  };
}
