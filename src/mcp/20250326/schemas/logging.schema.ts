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
import {
  BaseNotificationParamsSchema,
  NotificationSchema,
} from "../../../jsonrpc2/schemas/notifications.js";
import {
  BaseRequestParamsSchema,
  RequestSchema,
} from "../../../jsonrpc2/schemas/request.js";

/**
 * The severity of a log message.
 */
export const LoggingLevelSchema = z.enum([
  "debug",
  "info",
  "notice",
  "warning",
  "error",
  "critical",
  "alert",
  "emergency",
]);

/**
 * A request from the client to the server, to enable or adjust logging.
 */
export const SetLevelRequestSchema = RequestSchema.extend({
  method: z.literal("logging/setLevel"),
  params: BaseRequestParamsSchema.extend({
    /**
     * The level of logging that the client wants to receive from the server.
     * The server should send all logs at this level and higher (i.e., more
     * severe) to the client as notifications/logging/message.
     */
    level: LoggingLevelSchema,
  }),
});

/**
 * Notification of a log message passed from server to client. If no
 * logging/setLevel request has been sent from the client, the server MAY decide
 * which messages to send automatically.
 */
export const LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/message"),
  params: BaseNotificationParamsSchema.extend({
    /**
     * The severity of this log message.
     */
    level: LoggingLevelSchema,

    /**
     * An optional name of the logger issuing this message.
     */
    logger: z.optional(z.string()),

    /**
     * The data to be logged, such as a string message or an object. Any JSON
     * serializable type is allowed here.
     */
    data: z.unknown(),
  }),
});
