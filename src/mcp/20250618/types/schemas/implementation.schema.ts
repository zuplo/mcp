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
import { BaseMetadataSchema } from "./base.schema.js";

/**
 * Describes the name and version of an MCP implementation, with an optional
 * title for UI representation.
 */
export const ImplementationSchema = BaseMetadataSchema.extend({
  version: z.string(),
});
