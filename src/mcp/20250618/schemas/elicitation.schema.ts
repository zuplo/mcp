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
} from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";

export const StringSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minLength: z.optional(z.number()),
    maxLength: z.optional(z.number()),
    format: z.optional(z.enum(["email", "uri", "date", "date-time"])),
  })
  .loose();

export const NumberSchemaSchema = z
  .object({
    type: z.enum(["number", "integer"]),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minimum: z.optional(z.number()),
    maximum: z.optional(z.number()),
  })
  .loose();

export const BooleanSchemaSchema = z
  .object({
    type: z.literal("boolean"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    default: z.optional(z.boolean()),
  })
  .loose();

export const EnumSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    enum: z.array(z.string()),
    enumNames: z.optional(z.array(z.string())), // Display names for enum values
  })
  .loose();

/**
 * Restricted schema definitions that only allow primitive types
 * without nested objects or arrays.
 */
export const PrimitiveSchemaDefinitionSchema = z.discriminatedUnion("type", [
  StringSchemaSchema,
  NumberSchemaSchema,
  BooleanSchemaSchema,
  EnumSchemaSchema,
]);

/**
 * A request from the server to elicit additional information from the user via the client.
 */
export const ElicitRequestSchema = RequestSchema.extend({
  method: z.literal("elicitation/create"),
  params: BaseRequestParamsSchema.extend({
    /**
     * The message to present to the user.
     */
    message: z.string(),
    /**
     * A restricted subset of JSON Schema.
     * Only top-level properties are allowed, without nesting.
     */
    requestedSchema: z
      .object({
        type: z.literal("object"),
        properties: z.record(z.string(), PrimitiveSchemaDefinitionSchema),
        required: z.optional(z.array(z.string())),
      })
      .loose(),
  }),
});

/**
 * The client's response to an elicitation request.
 */
export const ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly declined the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: z.enum(["accept", "decline", "cancel"]),

  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   */
  content: z.optional(
    z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
  ),
});
