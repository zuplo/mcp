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

// Re-export from the 20250618 version as base metadata schemas haven't changed
export {
  BaseMetadataSchema,
  AnnotationsSchema,
} from "../../20250618/schemas/base.schema.js";

/**
 * An optionally-sized icon that can be displayed in a user interface.
 */
export const IconSchema = z
  .object({
    /**
     * A standard URI pointing to an icon resource. May be an HTTP/HTTPS URL or a
     * `data:` URI with Base64-encoded image data.
     */
    src: z.string(),

    /**
     * Optional MIME type override if the source MIME type is missing or generic.
     * For example: `"image/png"`, `"image/jpeg"`, or `"image/svg+xml"`.
     */
    mimeType: z.optional(z.string()),

    /**
     * Optional array of strings that specify sizes at which the icon can be used.
     * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
     */
    sizes: z.optional(z.array(z.string())),

    /**
     * Optional specifier for the theme this icon is designed for. `light` indicates
     * the icon is designed to be used with a light background, and `dark` indicates
     * the icon is designed to be used with a dark background.
     */
    theme: z.optional(z.enum(["light", "dark"])),
  })
  .loose();

/**
 * Base interface to add `icons` property.
 */
export const IconsSchema = z
  .object({
    /**
     * Optional set of sized icons that the client can display in a user interface.
     */
    icons: z.optional(z.array(IconSchema)),
  })
  .loose();
