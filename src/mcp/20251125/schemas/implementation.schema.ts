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
import { BaseMetadataSchema, IconsSchema } from "./base.schema.js";

/**
 * Describes the MCP implementation.
 */
export const ImplementationSchema = BaseMetadataSchema.merge(
  IconsSchema
).extend({
  version: z.string(),

  /**
   * An optional human-readable description of what this implementation does.
   */
  description: z.optional(z.string()),

  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: z.optional(z.string()),
});
