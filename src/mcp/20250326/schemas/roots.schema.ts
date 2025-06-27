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
import { NotificationSchema } from "../../../jsonrpc2/schemas/notifications.js";
import { RequestSchema } from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";

/* Roots */

/**
 * Represents a root directory or file that the server can operate on.
 */
export const RootSchema = z
  .object({
    /**
     * The URI identifying the root. This *must* start with file:// for now.
     */
    uri: z.string().startsWith("file://"),

    /**
     * An optional name for the root.
     */
    name: z.optional(z.string()),
  })
  .loose();

/**
 * Sent from the server to request a list of root URIs from the client.
 */
export const ListRootsRequestSchema = RequestSchema.extend({
  method: z.literal("roots/list"),
});

/**
 * The client's response to a roots/list request from the server.
 */
export const ListRootsResultSchema = ResultSchema.extend({
  roots: z.array(RootSchema),
});

/**
 * A notification from the client to the server, informing it that the list of
 * roots has changed.
 */
export const RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/roots/list_changed"),
});
