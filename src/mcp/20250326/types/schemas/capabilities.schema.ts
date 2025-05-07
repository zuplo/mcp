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

/**
 * Capabilities a client may support. Known capabilities are defined here,
 * in this schema, but this is not a closed set: any client can define its own,
 * additional capabilities.
 */
export const ClientCapabilitiesSchema = z
  .object({
    /**
     * Experimental, non-standard capabilities that the client supports.
     */
    experimental: z.optional(z.object({}).passthrough()),

    /**
     * Present if the client supports sampling from an LLM.
     */
    sampling: z.optional(z.object({}).passthrough()),

    /**
     * Present if the client supports listing roots.
     */
    roots: z.optional(
      z
        .object({
          /**
           * Whether the client supports issuing notifications for changes to
           * the roots list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .passthrough()
    ),
  })
  .passthrough();

/**
 * Capabilities that a server may support. Known capabilities are defined here,
 * in this schema, but this is not a closed set: any server can define its own,
 * additional capabilities.
 */
export const ServerCapabilitiesSchema = z
  .object({
    /**
     * Experimental, non-standard capabilities that the server supports.
     */
    experimental: z.optional(z.object({}).passthrough()),

    /**
     * Present if the server supports sending log messages to the client.
     */
    logging: z.optional(z.object({}).passthrough()),

    /**
     * Present if the server supports sending completions to the client.
     */
    completions: z.optional(z.object({}).passthrough()),

    /**
     * Present if the server offers any prompt templates.
     */
    prompts: z.optional(
      z
        .object({
          /**
           * Whether this server supports issuing notifications for changes to
           * the prompt list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .passthrough()
    ),

    /**
     * Present if the server offers any resources to read.
     */
    resources: z.optional(
      z
        .object({
          /**
           * Whether this server supports clients subscribing to resource updates.
           */
          subscribe: z.optional(z.boolean()),

          /**
           * Whether this server supports issuing notifications for changes to
           * the resource list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .passthrough()
    ),

    /**
     * Present if the server offers any tools to call.
     */
    tools: z.optional(
      z
        .object({
          /**
           * Whether this server supports issuing notifications for changes to
           * the tool list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .passthrough()
    ),
  })
  .passthrough();
