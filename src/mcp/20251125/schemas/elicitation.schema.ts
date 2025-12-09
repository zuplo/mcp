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
import { NotificationSchema } from "../../../jsonrpc2/schemas/notifications.js";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";
import { TaskMetadataSchema } from "./tasks.schema.js";

export const StringSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minLength: z.optional(z.number()),
    maxLength: z.optional(z.number()),
    format: z.optional(z.enum(["email", "uri", "date", "date-time"])),
    default: z.optional(z.string()),
  })
  .loose();

export const NumberSchemaSchema = z
  .object({
    type: z.enum(["number", "integer"]),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minimum: z.optional(z.number()),
    maximum: z.optional(z.number()),
    default: z.optional(z.number()),
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

/**
 * Schema for single-selection enumeration without display titles for options.
 */
export const UntitledSingleSelectEnumSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    enum: z.array(z.string()),
    default: z.optional(z.string()),
  })
  .loose();

/**
 * Schema for single-selection enumeration with display titles for each option.
 */
export const TitledSingleSelectEnumSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    oneOf: z.array(
      z.object({
        const: z.string(),
        title: z.string(),
      })
    ),
    default: z.optional(z.string()),
  })
  .loose();

/**
 * Combined single selection enumeration.
 */
export const SingleSelectEnumSchemaSchema = z.union([
  UntitledSingleSelectEnumSchemaSchema,
  TitledSingleSelectEnumSchemaSchema,
]);

/**
 * Schema for multiple-selection enumeration without display titles for options.
 */
export const UntitledMultiSelectEnumSchemaSchema = z
  .object({
    type: z.literal("array"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minItems: z.optional(z.number()),
    maxItems: z.optional(z.number()),
    items: z.object({
      type: z.literal("string"),
      enum: z.array(z.string()),
    }),
    default: z.optional(z.array(z.string())),
  })
  .loose();

/**
 * Schema for multiple-selection enumeration with display titles for each option.
 */
export const TitledMultiSelectEnumSchemaSchema = z
  .object({
    type: z.literal("array"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    minItems: z.optional(z.number()),
    maxItems: z.optional(z.number()),
    items: z.object({
      anyOf: z.array(
        z.object({
          const: z.string(),
          title: z.string(),
        })
      ),
    }),
    default: z.optional(z.array(z.string())),
  })
  .loose();

/**
 * Combined multiple selection enumeration.
 */
export const MultiSelectEnumSchemaSchema = z.union([
  UntitledMultiSelectEnumSchemaSchema,
  TitledMultiSelectEnumSchemaSchema,
]);

/**
 * Legacy titled enum schema (deprecated).
 */
export const LegacyTitledEnumSchemaSchema = z
  .object({
    type: z.literal("string"),
    title: z.optional(z.string()),
    description: z.optional(z.string()),
    enum: z.array(z.string()),
    enumNames: z.optional(z.array(z.string())),
    default: z.optional(z.string()),
  })
  .loose();

/**
 * Union type for all enum schemas.
 */
export const EnumSchemaSchema = z.union([
  SingleSelectEnumSchemaSchema,
  MultiSelectEnumSchemaSchema,
  LegacyTitledEnumSchemaSchema,
]);

/**
 * Restricted schema definitions that only allow primitive types
 * without nested objects or arrays.
 */
export const PrimitiveSchemaDefinitionSchema = z.union([
  StringSchemaSchema,
  NumberSchemaSchema,
  BooleanSchemaSchema,
  EnumSchemaSchema,
]);

/**
 * Parameters for form-based elicitation.
 */
export const ElicitRequestFormParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: z.optional(z.literal("form")),

  /**
   * The message to present to the user describing what information is being requested.
   */
  message: z.string(),

  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: z
    .object({
      $schema: z.optional(z.string()),
      type: z.literal("object"),
      properties: z.record(z.string(), PrimitiveSchemaDefinitionSchema),
      required: z.optional(z.array(z.string())),
    })
    .loose(),

  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   */
  task: z.optional(TaskMetadataSchema),
});

/**
 * Parameters for URL-based elicitation.
 */
export const ElicitRequestURLParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: z.literal("url"),

  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: z.string(),

  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   */
  elicitationId: z.string(),

  /**
   * The URL that the user should navigate to.
   */
  url: z.string(),

  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   */
  task: z.optional(TaskMetadataSchema),
});

/**
 * Union of elicitation request params.
 */
export const ElicitRequestParamsSchema = z.union([
  ElicitRequestFormParamsSchema,
  ElicitRequestURLParamsSchema,
]);

/**
 * A request from the server to elicit additional information from the user via the client.
 */
export const ElicitRequestSchema = RequestSchema.extend({
  method: z.literal("elicitation/create"),
  params: ElicitRequestParamsSchema,
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
   * The submitted form data, only present when action is "accept" and mode was "form".
   * Contains values matching the requested schema.
   * Omitted for out-of-band mode responses.
   */
  content: z.optional(
    z.record(
      z.string(),
      z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])
    )
  ),
});

/**
 * An optional notification from the server to the client, informing it of a
 * completion of an out-of-band elicitation request.
 */
export const ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/elicitation/complete"),
  params: z.object({
    /**
     * The ID of the elicitation that completed.
     */
    elicitationId: z.string(),
  }),
});
