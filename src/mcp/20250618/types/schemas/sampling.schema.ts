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
import {
  AudioContentSchema,
  ImageContentSchema,
  TextContentSchema,
} from "./content.schema.js";

/**
 * Hints to use for model selection.
 *
 * Keys not declared here are currently left unspecified by the spec and are up
 * to the client to interpret.
 */
export const ModelHintSchema = z
  .object({
    /**
     * A hint for a model name.
     *
     * The client SHOULD treat this as a substring of a model name; for example:
     *  - `claude-3-5-sonnet` should match `claude-3-5-sonnet-20241022`
     *  - `sonnet` should match `claude-3-5-sonnet-20241022`, `claude-3-sonnet-20240229`, etc.
     *  - `claude` should match any Claude model
     *
     * The client MAY also map the string to a different provider's model name
     * or a different model family, as long as it fills a similar niche; for example:
     *  - `gemini-1.5-flash` could match `claude-3-haiku-20240307`
     */
    name: z.optional(z.string()),
  })
  .loose();

/**
 * The server's preferences for model selection, requested of the client during sampling.
 *
 * Because LLMs can vary along multiple dimensions, choosing the "best" model is
 * rarely straightforward.  Different models excel in different areas—some are
 * faster but less capable, others are more capable but more expensive, and so
 * on. This interface allows servers to express their priorities across multiple
 * dimensions to help clients make an appropriate selection for their use case.
 *
 * These preferences are always advisory. The client MAY ignore them. It is also
 * up to the client to decide how to interpret these preferences and how to
 * balance them against other considerations.
 */
export const ModelPreferencesSchema = z
  .object({
    /**
     * Optional hints to use for model selection.
     *
     * If multiple hints are specified, the client MUST evaluate them in order
     * (such that the first match is taken).
     *
     * The client SHOULD prioritize these hints over the numeric priorities, but
     * MAY still use the priorities to select from ambiguous matches.
     */
    hints: z.optional(z.array(ModelHintSchema)),

    /**
     * How much to prioritize cost when selecting a model. A value of 0 means cost
     * is not important, while a value of 1 means cost is the most important
     * factor.
     */
    costPriority: z.optional(z.number().min(0).max(1)),

    /**
     * How much to prioritize sampling speed (latency) when selecting a model. A
     * value of 0 means speed is not important, while a value of 1 means speed is
     * the most important factor.
     */
    speedPriority: z.optional(z.number().min(0).max(1)),

    /**
     * How much to prioritize intelligence and capabilities when selecting a
     * model. A value of 0 means intelligence is not important, while a value of 1
     * means intelligence is the most important factor.
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
    content: z.discriminatedUnion("type", [
      TextContentSchema,
      ImageContentSchema,
      AudioContentSchema,
    ]),
  })
  .loose();

/**
 * A request from the server to sample an LLM via the client. The client has full
 * discretion over which model to select. The client should also inform the user
 * before beginning sampling, to allow them to inspect the request (human in the
 * loop) and decide whether to approve it.
 */
export const CreateMessageRequestSchema = RequestSchema.extend({
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
   * The reason why sampling stopped, if known.
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
