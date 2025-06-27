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

/**
 * Hints to use for model selection.
 */
export const ModelHintSchema = z
  .object({
    /**
     * A hint for a model name.
     */
    name: z.string().optional(),
  })
  .loose();

/**
 * The server's preferences for model selection, requested of the client during
 * sampling.
 */
export const ModelPreferencesSchema = z
  .object({
    /**
     * Optional hints to use for model selection.
     */
    hints: z.optional(z.array(ModelHintSchema)),

    /**
     * How much to prioritize cost when selecting a model.
     */
    costPriority: z.optional(z.number().min(0).max(1)),

    /**
     * How much to prioritize sampling speed (latency) when selecting a model.
     */
    speedPriority: z.optional(z.number().min(0).max(1)),

    /**
     * How much to prioritize intelligence and capabilities when selecting a model.
     */
    intelligencePriority: z.optional(z.number().min(0).max(1)),
  })
  .loose();

/**
 * Describes a message issued to or received from an LLM API.
 */
export const SamplingMessageSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.union([
      TextContentSchema,
      ImageContentSchema,
      AudioContentSchema,
    ]),
  })
  .loose();

/**
 * A request from the server to sample an LLM via the client. The client has
 * full discretion over which model to select. The client should also inform
 * the user before beginning sampling, to allow them to inspect the request
 * (human in the loop) and decide whether to approve it.
 */
export const CreateMessageRequestSchema = RequestSchema.extend({
  method: z.literal("sampling/createMessage"),
  params: BaseRequestParamsSchema.extend({
    messages: z.array(SamplingMessageSchema),
    /**
     * An optional system prompt the server wants to use for sampling. The
     * client MAY modify or omit this prompt.
     */
    systemPrompt: z.optional(z.string()),

    /**
     * A request to include context from one or more MCP servers (including the
     * caller), to be attached to the prompt. The client MAY ignore this
     * request.
     */
    includeContext: z.optional(z.enum(["none", "thisServer", "allServers"])),
    temperature: z.optional(z.number()),

    /**
     * The maximum number of tokens to sample, as requested by the server. The
     * client MAY choose to sample fewer tokens than requested.
     */
    maxTokens: z.number().int(),
    stopSequences: z.optional(z.array(z.string())),

    /**
     * Optional metadata to pass through to the LLM provider. The format of this
     * metadata is provider-specific.
     */
    metadata: z.optional(z.object({}).loose()),

    /**
     * The server's preferences for which model to select.
     */
    modelPreferences: z.optional(ModelPreferencesSchema),
  }),
});

/**
 * The client's response to a sampling/create_message request from the server.
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
   * The reason why sampling stopped.
   */
  stopReason: z.optional(
    z.enum(["endTurn", "stopSequence", "maxTokens"]).or(z.string())
  ),
  role: z.enum(["user", "assistant"]),
  content: z.discriminatedUnion("type", [
    TextContentSchema,
    ImageContentSchema,
    AudioContentSchema,
  ]),
});
