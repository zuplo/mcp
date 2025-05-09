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
import { JSONRPC_VERSION } from "../consts.js";
import { IdSchema } from "./id.js";

/**
 * A response to a request that indicates an error occurred.
 */
export const JSONRPCErrorSchema = z
  .object({
    jsonrpc: z.literal(JSONRPC_VERSION),
    id: IdSchema,
    error: z.object({
      /**
       * The error type that occurred.
       */
      code: z.number().int(),

      /**
       * A short description of the error. The message SHOULD be limited to a
       * concise single sentence.
       */
      message: z.string(),

      /**
       * Additional information about the error. The value of this member is
       * defined by the sender (e.g. detailed error information, nested errors
       * etc.).
       */
      data: z.optional(z.unknown()),
    }),
  })
  .strict();
