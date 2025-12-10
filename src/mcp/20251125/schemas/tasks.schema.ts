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
import { RequestSchema } from "../../../jsonrpc2/schemas/request.js";
import { ResultSchema } from "../../../jsonrpc2/schemas/response.js";
import {
  PaginatedRequestSchema,
  PaginatedResultSchema,
} from "./pagination.schema.js";

/**
 * The status of a task.
 */
export const TaskStatusSchema = z.enum([
  "working",
  "input_required",
  "completed",
  "failed",
  "cancelled",
]);

/**
 * Metadata for augmenting a request with task execution.
 */
export const TaskMetadataSchema = z
  .object({
    /**
     * Requested duration in milliseconds to retain task from creation.
     */
    ttl: z.optional(z.number()),
  })
  .loose();

/**
 * Metadata for associating messages with a task.
 */
export const RelatedTaskMetadataSchema = z
  .object({
    /**
     * The task identifier this message is associated with.
     */
    taskId: z.string(),
  })
  .loose();

/**
 * Data associated with a task.
 */
export const TaskSchema = z
  .object({
    /**
     * The task identifier.
     */
    taskId: z.string(),

    /**
     * Current task state.
     */
    status: TaskStatusSchema,

    /**
     * Optional human-readable message describing the current task state.
     */
    statusMessage: z.optional(z.string()),

    /**
     * ISO 8601 timestamp when the task was created.
     */
    createdAt: z.string(),

    /**
     * ISO 8601 timestamp when the task was last updated.
     */
    lastUpdatedAt: z.string(),

    /**
     * Actual retention duration from creation in milliseconds, null for unlimited.
     */
    ttl: z.union([z.number(), z.null()]),

    /**
     * Suggested polling interval in milliseconds.
     */
    pollInterval: z.optional(z.number()),
  })
  .loose();

/**
 * A response to a task-augmented request.
 */
export const CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema,
});

/**
 * A request to retrieve the state of a task.
 */
export const GetTaskRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/get"),
  params: z.object({
    /**
     * The task identifier to query.
     */
    taskId: z.string(),
  }),
});

/**
 * The response to a tasks/get request.
 */
export const GetTaskResultSchema = ResultSchema.merge(TaskSchema);

/**
 * A request to retrieve the result of a completed task.
 */
export const GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/result"),
  params: z.object({
    /**
     * The task identifier to retrieve results for.
     */
    taskId: z.string(),
  }),
});

/**
 * The response to a tasks/result request.
 */
export const GetTaskPayloadResultSchema = ResultSchema.extend({}).loose();

/**
 * A request to cancel a task.
 */
export const CancelTaskRequestSchema = RequestSchema.extend({
  method: z.literal("tasks/cancel"),
  params: z.object({
    /**
     * The task identifier to cancel.
     */
    taskId: z.string(),
  }),
});

/**
 * The response to a tasks/cancel request.
 */
export const CancelTaskResultSchema = ResultSchema.merge(TaskSchema);

/**
 * A request to retrieve a list of tasks.
 */
export const ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: z.literal("tasks/list"),
});

/**
 * The response to a tasks/list request.
 */
export const ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: z.array(TaskSchema),
});

/**
 * An optional notification from the receiver to the requestor, informing them
 * that a task's status has changed.
 */
export const TaskStatusNotificationSchema = NotificationSchema.extend({
  method: z.literal("notifications/tasks/status"),
  params: BaseNotificationParamsSchema.merge(TaskSchema),
});
