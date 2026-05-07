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
import { AnnotationsSchema } from "./base.schema.js";

/**
 * Text provided to or from an LLM.
 */
export const TextContentSchema = z.looseObject({
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
  _meta: z.optional(z.looseObject({})),
});

/**
 * An image provided to or from an LLM.
 */
export const ImageContentSchema = z.looseObject({
  type: z.literal("image"),

  /**
   * The base64-encoded image data.
   */
  data: z.base64(),

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
  _meta: z.optional(z.looseObject({})),
});

/**
 * Audio provided to or from an LLM.
 */
export const AudioContentSchema = z.looseObject({
  type: z.literal("audio"),

  /**
   * The base64-encoded audio data.
   */
  data: z.base64(),

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
  _meta: z.optional(z.looseObject({})),
});

/**
 * The contents of a resource, embedded into a prompt or tool call result.
 *
 * It is up to the client how best to render embedded resources for the benefit
 * of the LLM and/or the user.
 */
export const EmbeddedResourceSchema = z.lazy(() =>
  z.looseObject({
    type: z.literal("resource"),
    resource: z.union([
      z.looseObject({
        uri: z.url(),
        mimeType: z.optional(z.string()),
        _meta: z.optional(z.looseObject({})),
        text: z.string(),
      }),
      z.looseObject({
        uri: z.url(),
        mimeType: z.optional(z.string()),
        _meta: z.optional(z.looseObject({})),
        blob: z.base64(),
      }),
    ]),

    /**
     * Optional annotations for the client.
     */
    annotations: z.optional(AnnotationsSchema),

    /**
     * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.looseObject({})),
  })
);
