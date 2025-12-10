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
import {
  AudioContentSchema,
  ImageContentSchema,
  TextContentSchema,
} from "./content.schema.js";

// Re-export unchanged schemas from 20250618
export {
  ModelHintSchema,
  ModelPreferencesSchema,
} from "../../20250618/schemas/sampling.schema.js";

// Import for use in this module
import { ModelPreferencesSchema } from "../../20250618/schemas/sampling.schema.js";
import { TaskMetadataSchema } from "./tasks.schema.js";

/**
 * A request from the assistant to call a tool.
 */
export const ToolUseContentSchema = z
  .object({
    type: z.literal("tool_use"),

    /**
     * A unique identifier for this tool use.
     */
    id: z.string(),

    /**
     * The name of the tool to call.
     */
    name: z.string(),

    /**
     * The arguments to pass to the tool, conforming to the tool's input schema.
     */
    input: z.record(z.string(), z.unknown()),

    /**
     * Optional metadata about the tool use.
     */
    _meta: z.optional(z.object({}).loose()),
  })
  .loose();

/**
 * The result of a tool use, provided by the user back to the assistant.
 */
export const ToolResultContentSchema = z.lazy(() => {
  const { EmbeddedResourceSchema } = require("./content.schema.js");
  const { ResourceLinkSchema } = require("./resource.schema.js");

  return z
    .object({
      type: z.literal("tool_result"),

      /**
       * The ID of the tool use this result corresponds to.
       */
      toolUseId: z.string(),

      /**
       * The unstructured result content of the tool use.
       */
      content: z.array(
        z.discriminatedUnion("type", [
          TextContentSchema,
          ImageContentSchema,
          AudioContentSchema,
          ResourceLinkSchema,
          EmbeddedResourceSchema,
        ])
      ),

      /**
       * An optional structured result object.
       */
      structuredContent: z.optional(z.record(z.string(), z.unknown())),

      /**
       * Whether the tool use resulted in an error.
       */
      isError: z.optional(z.boolean()),

      /**
       * Optional metadata about the tool result.
       */
      _meta: z.optional(z.object({}).loose()),
    })
    .loose();
});

/**
 * Content block types for sampling messages.
 */
export const SamplingMessageContentBlockSchema = z.discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema,
]);

/**
 * Describes a message issued to or received from an LLM API.
 */
export const SamplingMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.union([
      SamplingMessageContentBlockSchema,
      z.array(SamplingMessageContentBlockSchema),
    ]),
    /**
     * See [specification/2025-11-25/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).loose()),
  })
  .loose();

/**
 * Controls tool selection behavior for sampling requests.
 */
export const ToolChoiceSchema = z
  .object({
    /**
     * Controls the tool use ability of the model:
     * - "auto": Model decides whether to use tools (default)
     * - "required": Model MUST use at least one tool before completing
     * - "none": Model MUST NOT use any tools
     */
    mode: z.optional(z.enum(["auto", "required", "none"])),
  })
  .loose();

/**
 * A request from the server to sample an LLM via the client. The client has full
 * discretion over which model to select. The client should also inform the user
 * before beginning sampling, to allow them to inspect the request (human in the
 * loop) and decide whether to approve it.
 */
export const CreateMessageRequestSchema = z.lazy(() => {
  const { ToolSchema } = require("./tools.schema.js");

  return RequestSchema.extend({
    method: z.literal("sampling/createMessage"),
    params: BaseRequestParamsSchema.extend({
      messages: z.array(SamplingMessageSchema),
      /**
       * The server's preferences for which model to select. The client MAY ignore
       * these preferences.
       */
      modelPreferences: z.optional(ModelPreferencesSchema),
      /**
       * An optional system prompt the server wants to use for sampling. The
       * client MAY modify or omit this prompt.
       */
      systemPrompt: z.optional(z.string()),
      /**
       * A request to include context from one or more MCP servers (including the
       * caller), to be attached to the prompt. The client MAY ignore this request.
       *
       * Default is "none". Values "thisServer" and "allServers" are soft-deprecated.
       */
      includeContext: z.optional(z.enum(["none", "thisServer", "allServers"])),
      temperature: z.optional(z.number()),
      /**
       * The maximum number of tokens to sample, as requested by the server. The
       * client MAY choose to sample fewer tokens than requested.
       */
      maxTokens: z.number(),
      stopSequences: z.optional(z.array(z.string())),
      /**
       * Optional metadata to pass through to the LLM provider. The format of this
       * metadata is provider-specific.
       */
      metadata: z.optional(z.object({}).loose()),
      /**
       * Tools that the model may use during generation.
       */
      tools: z.optional(z.array(ToolSchema)),
      /**
       * Controls how the model uses tools.
       */
      toolChoice: z.optional(ToolChoiceSchema),
      /**
       * If specified, the caller is requesting task-augmented execution for this request.
       */
      task: z.optional(TaskMetadataSchema),
    }),
  });
});

/**
 * The client's response to a sampling/createMessage request from the server.
 * The client should inform the user before returning the sampled message, to
 * allow them to inspect the response (human in the loop) and decide whether to
 * allow the server to see it.
 */
export const CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: z.string(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   */
  stopReason: z.optional(
    z.enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(z.string())
  ),
  role: z.enum(["user", "assistant"]),
  content: z.union([
    SamplingMessageContentBlockSchema,
    z.array(SamplingMessageContentBlockSchema),
  ]),
});
