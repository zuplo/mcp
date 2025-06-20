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
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../../jsonrpc2/schemas/response.js";

/**
 * A reference to a resource or resource template definition.
 */
export const ResourceReferenceSchema = z
  .object({
    type: z.literal("ref/resource"),

    /**
     * The URI or URI template of the resource.
     */
    uri: z.string(),
  })
  .loose();

/**
 * Identifies a prompt.
 */
export const PromptReferenceSchema = z
  .object({
    type: z.literal("ref/prompt"),
    /**
     * The name of the prompt or prompt template
     */
    name: z.string(),
  })
  .loose();

/**
 * A request from the client to the server, to ask for completion options.
 */
export const CompleteRequestSchema = RequestSchema.extend({
  method: z.literal("completion/complete"),
  params: BaseRequestParamsSchema.extend({
    ref: z.union([PromptReferenceSchema, ResourceReferenceSchema]),

    /**
     * The argument's information
     */
    argument: z
      .object({
        /**
         * The name of the argument
         */
        name: z.string(),

        /**
         * The value of the argument to use for completion matching.
         */
        value: z.string(),
      })
      .loose(),
  }),
});

/**
 * The server's response to a completion/complete request
 */
export const CompleteResultSchema = ResultSchema.extend({
  completion: z
    .object({
      /**
       * An array of completion values. Must not exceed 100 items.
       */
      values: z.array(z.string()).max(100),

      /**
       * The total number of completion options available. This can exceed the
       * number of values actually sent in the response.
       */
      total: z.optional(z.number().int()),

      /**
       * Indicates whether there are additional completion options beyond those
       * provided in the current response, even if the exact total is unknown.
       */
      hasMore: z.optional(z.boolean()),
    })
    .loose(),
});
