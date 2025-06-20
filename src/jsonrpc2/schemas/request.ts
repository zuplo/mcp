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
import { JSONRPC_VERSION } from "../consts.js";
import { IdSchema } from "./id.js";

/**
 * A progress token, used to associate progress notifications with the original
 * request.
 */
export const ProgressTokenSchema = z.union([z.string(), z.number().int()]);

export const RequestMetaSchema = z
  .object({
    /**
     * If specified, the caller is requesting out-of-band progress notifications
     * for this request (as represented by notifications/progress). The value of
     * this parameter is an opaque token that will be attached to any subsequent
     * notifications. The receiver is not obligated to provide these
     * notifications.
     */
    progressToken: z.optional(ProgressTokenSchema),
  })
  .loose();

export const BaseRequestParamsSchema = z
  .object({
    _meta: z.optional(RequestMetaSchema),
  })
  .loose();

export const RequestSchema = z.object({
  method: z.string(),
  params: z.optional(BaseRequestParamsSchema),
});

/**
 * A request that expects a response.
 */
export const JSONRPCRequestSchema = z
  .object({
    jsonrpc: z.literal(JSONRPC_VERSION),
    id: IdSchema,
    ...RequestSchema.shape,
  })
  .strict();
