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
import { IdSchema } from "../../../jsonrpc2/schemas/id.js";
import {
  BaseNotificationParamsSchema,
  NotificationSchema,
} from "../../../jsonrpc2/schemas/notifications.js";

// Re-export unchanged schemas from 20250618
export {
  InitializedNotificationSchema,
  ProgressNotificationSchema,
} from "../../20250618/schemas/notifications.schema.js";

/**
 * This notification can be sent by either side to indicate that it is
 * cancelling a previously-issued request.
 *
 * The request SHOULD still be in-flight, but due to communication latency, it
 * is always possible that this notification MAY arrive after the request has
 * already finished.
 *
 * This notification indicates that the result will be unused, so any associated
 * processing SHOULD cease.
 *
 * A client MUST NOT attempt to cancel its `initialize` request.
 *
 * For task cancellation, use the `tasks/cancel` request instead of this notification.
 */
export const CancelledNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/cancelled"),
  params: BaseNotificationParamsSchema.extend({
    /**
     * The ID of the request to cancel.
     *
     * This MUST correspond to the ID of a request previously issued in the same direction.
     * This MUST be provided for cancelling non-task requests.
     * This MUST NOT be used for cancelling tasks (use the `tasks/cancel` request instead).
     */
    requestId: z.optional(IdSchema),

    /**
     * An optional string describing the reason for the cancellation. This MAY
     * be logged or presented to the user.
     */
    reason: z.string().optional(),
  }),
});
