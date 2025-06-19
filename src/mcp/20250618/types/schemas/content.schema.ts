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
import { AnnotationsSchema } from "./base.schema.js";

/**
 * Text provided to or from an LLM.
 */
export const TextContentSchema = z
  .object({
    type: z.literal("text"),

    /**
     * The text content of the message.
     */
    text: z.string(),

    /**
     * Optional annotations for the client.
     */
    annotations: z.optional(AnnotationsSchema),

    /**
     * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).passthrough()),
  })
  .passthrough();

/**
 * An image provided to or from an LLM.
 */
export const ImageContentSchema = z
  .object({
    type: z.literal("image"),

    /**
     * The base64-encoded image data.
     */
    data: z.string().base64(),

    /**
     * The MIME type of the image. Different providers may support different image types.
     */
    mimeType: z.string(),

    /**
     * Optional annotations for the client.
     */
    annotations: z.optional(AnnotationsSchema),

    /**
     * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).passthrough()),
  })
  .passthrough();

/**
 * Audio provided to or from an LLM.
 */
export const AudioContentSchema = z
  .object({
    type: z.literal("audio"),

    /**
     * The base64-encoded audio data.
     */
    data: z.string().base64(),

    /**
     * The MIME type of the audio. Different providers may support different audio types.
     */
    mimeType: z.string(),

    /**
     * Optional annotations for the client.
     */
    annotations: z.optional(AnnotationsSchema),

    /**
     * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).passthrough()),
  })
  .passthrough();

/**
 * The contents of a resource, embedded into a prompt or tool call result.
 *
 * It is up to the client how best to render embedded resources for the benefit
 * of the LLM and/or the user.
 */
export const EmbeddedResourceSchema = z.lazy(() =>
  z
    .object({
      type: z.literal("resource"),
      resource: z.union([
        z
          .object({
            uri: z.string().url(),
            mimeType: z.optional(z.string()),
            _meta: z.optional(z.object({}).passthrough()),
            text: z.string(),
          })
          .passthrough(),
        z
          .object({
            uri: z.string().url(),
            mimeType: z.optional(z.string()),
            _meta: z.optional(z.object({}).passthrough()),
            blob: z.string().base64(),
          })
          .passthrough(),
      ]),

      /**
       * Optional annotations for the client.
       */
      annotations: z.optional(AnnotationsSchema),

      /**
       * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
       */
      _meta: z.optional(z.object({}).passthrough()),
    })
    .passthrough()
);
