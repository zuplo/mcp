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
 * Base interface for metadata with name (identifier) and title (display name)
 * properties.
 */
export const BaseMetadataSchema = z
  .object({
    /**
     * Intended for programmatic or logical use, but used as a display name in
     * past specs or fallback (if title isn't present).
     */
    name: z.string(),

    /**
     * Intended for UI and end-user contexts — optimized to be human-readable
     * and easily understood,
     * even by those unfamiliar with domain-specific terminology.
     *
     * If not provided, the name should be used for display (except for Tool,
     * where `annotations.title` should be given precedence over using `name`,
     * if present).
     */
    title: z.optional(z.string()),
  })
  .loose();

/**
 * Optional annotations for the client. The client can use annotations to inform
 * how objects are used or displayed
 */
export const AnnotationsSchema = z
  .object({
    /**
     * Describes who the intended customer of this object or data is.
     *
     * It can include multiple entries to indicate content useful for multiple
     * audiences (e.g., `["user", "assistant"]`).
     */
    audience: z.optional(z.array(z.enum(["user", "assistant"]))),

    /**
     * Describes how important this data is for operating the server.
     *
     * A value of 1 means "most important," and indicates that the data is
     * effectively required, while 0 means "least important," and indicates that
     * the data is entirely optional.
     */
    priority: z.optional(z.number().min(0).max(1)),

    /**
     * The moment the resource was last modified, as an ISO 8601 formatted string.
     *
     * Should be an ISO 8601 formatted string (e.g., "2025-01-12T15:00:58Z").
     *
     * Examples: last activity timestamp in an open file, timestamp when the resource
     * was attached, etc.
     */
    lastModified: z.optional(z.string()),
  })
  .loose();
