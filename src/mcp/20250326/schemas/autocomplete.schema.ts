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

import * as z from "zod/mini";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";

/**
 * A reference to a resource or resource template definition.
 */
export const ResourceReferenceSchema = z.looseObject({
  type: z.literal("ref/resource"),

  /**
   * The URI or URI template of the resource.
   */
  uri: z.string(),
});

/**
 * Identifies a prompt.
 */
export const PromptReferenceSchema = z.looseObject({
  type: z.literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: z.string(),
});

/**
 * A request from the client to the server, to ask for completion options.
 */
export const CompleteRequestSchema = z.extend(RequestSchema, {
  method: z.literal("completion/complete"),
  params: z.extend(BaseRequestParamsSchema, {
    ref: z.union([PromptReferenceSchema, ResourceReferenceSchema]),

    /**
     * The argument's information
     */
    argument: z.looseObject({
      /**
       * The name of the argument
       */
      name: z.string(),

      /**
       * The value of the argument to use for completion matching.
       */
      value: z.string(),
    }),
  }),
});

/**
 * The server's response to a completion/complete request
 */
export const CompleteResultSchema = z.extend(ResultSchema, {
  completion: z.looseObject({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: z.array(z.string()).check(z.maxLength(100)),

    /**
     * The total number of completion options available. This can exceed the
     * number of values actually sent in the response.
     */
    total: z.optional(z.int()),

    /**
     * Indicates whether there are additional completion options beyond those
     * provided in the current response, even if the exact total is unknown.
     */
    hasMore: z.optional(z.boolean()),
  }),
});
