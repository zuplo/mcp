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
    experimental: z.optional(z.record(z.string(), z.object({}).loose())),

    /**
     * Present if the client supports listing roots.
     */
    roots: z.optional(
      z
        .object({
          /**
           * Whether the client supports notifications for changes to the roots list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .loose()
    ),

    /**
     * Present if the client supports sampling from an LLM.
     */
    sampling: z.optional(
      z
        .object({
          /**
           * Whether the client supports context inclusion via includeContext parameter.
           */
          context: z.optional(z.object({}).loose()),
          /**
           * Whether the client supports tool use via tools and toolChoice parameters.
           */
          tools: z.optional(z.object({}).loose()),
        })
        .loose()
    ),

    /**
     * Present if the client supports elicitation from the server.
     */
    elicitation: z.optional(
      z
        .object({
          form: z.optional(z.object({}).loose()),
          url: z.optional(z.object({}).loose()),
        })
        .loose()
    ),

    /**
     * Present if the client supports task-augmented requests.
     */
    tasks: z.optional(
      z
        .object({
          /**
           * Whether this client supports tasks/list.
           */
          list: z.optional(z.object({}).loose()),
          /**
           * Whether this client supports tasks/cancel.
           */
          cancel: z.optional(z.object({}).loose()),
          /**
           * Specifies which request types can be augmented with tasks.
           */
          requests: z.optional(
            z
              .object({
                sampling: z.optional(
                  z
                    .object({
                      createMessage: z.optional(z.object({}).loose()),
                    })
                    .loose()
                ),
                elicitation: z.optional(
                  z
                    .object({
                      create: z.optional(z.object({}).loose()),
                    })
                    .loose()
                ),
              })
              .loose()
          ),
        })
        .loose()
    ),
  })
  .loose();

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
    experimental: z.optional(z.record(z.string(), z.object({}).loose())),

    /**
     * Present if the server supports sending log messages to the client.
     */
    logging: z.optional(z.object({}).loose()),

    /**
     * Present if the server supports argument autocompletion suggestions.
     */
    completions: z.optional(z.object({}).loose()),

    /**
     * Present if the server offers any prompt templates.
     */
    prompts: z.optional(
      z
        .object({
          /**
           * Whether this server supports notifications for changes to the prompt list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .loose()
    ),

    /**
     * Present if the server offers any resources to read.
     */
    resources: z.optional(
      z
        .object({
          /**
           * Whether this server supports subscribing to resource updates.
           */
          subscribe: z.optional(z.boolean()),
          /**
           * Whether this server supports notifications for changes to the resource list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .loose()
    ),

    /**
     * Present if the server offers any tools to call.
     */
    tools: z.optional(
      z
        .object({
          /**
           * Whether this server supports notifications for changes to the tool list.
           */
          listChanged: z.optional(z.boolean()),
        })
        .loose()
    ),

    /**
     * Present if the server supports task-augmented requests.
     */
    tasks: z.optional(
      z
        .object({
          /**
           * Whether this server supports tasks/list.
           */
          list: z.optional(z.object({}).loose()),
          /**
           * Whether this server supports tasks/cancel.
           */
          cancel: z.optional(z.object({}).loose()),
          /**
           * Specifies which request types can be augmented with tasks.
           */
          requests: z.optional(
            z
              .object({
                tools: z.optional(
                  z
                    .object({
                      call: z.optional(z.object({}).loose()),
                    })
                    .loose()
                ),
              })
              .loose()
          ),
        })
        .loose()
    ),
  })
  .loose();
