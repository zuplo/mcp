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
import { NotificationSchema } from "../../../../jsonrpc2/schemas/notifications.js";
import { RequestSchema } from "../../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../../jsonrpc2/schemas/response.js";

/**
 * Represents a root directory or file that the server can operate on.
 */
export const RootSchema = z
  .object({
    /**
     * The URI identifying the root. This *must* start with file:// for now.
     * This restriction may be relaxed in future versions of the protocol to allow
     * other URI schemes.
     */
    uri: z.url(),
    /**
     * An optional name for the root. This can be used to provide a human-readable
     * identifier for the root, which may be useful for display purposes or for
     * referencing the root in other parts of the application.
     */
    name: z.optional(z.string()),

    /**
     * See [specification/2025-06-18/basic/index#general-fields] for notes on _meta usage.
     */
    _meta: z.optional(z.object({}).loose()),
  })
  .loose();

/**
 * Sent from the server to request a list of root URIs from the client. Roots allow
 * servers to ask for specific directories or files to operate on. A common example
 * for roots is providing a set of repositories or directories a server should operate
 * on.
 *
 * This request is typically used when the server needs to understand the file system
 * structure or access specific locations that the client has permission to read from.
 */
export const ListRootsRequestSchema = RequestSchema.extend({
  method: z.literal("roots/list"),
});

/**
 * The client's response to a roots/list request from the server.
 * This result contains an array of Root objects, each representing a root directory
 * or file that the server can operate on.
 */
export const ListRootsResultSchema = ResultSchema.extend({
  roots: z.array(RootSchema),
});

/**
 * A notification from the client to the server, informing it that the list of roots has changed.
 * This notification should be sent whenever the client adds, removes, or modifies any root.
 * The server should then request an updated list of roots using the ListRootsRequest.
 */
export const RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/roots/list_changed"),
});
