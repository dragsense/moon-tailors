import { z } from "zod";
import {
  createPaginatedSchema,
  listQuerySchema,
} from "../../common/schema.js";
import { ETaskStatus } from "./enum.js";
import { field } from "../../lib/field-meta.js";
import { userSchema } from "../user/schema.js";

export const taskStatusSchema = z.nativeEnum(ETaskStatus);

/** Nested assignee on GET responses (enrichment, not write payload). */
export const taskAssigneeSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
});

/** POST /tasks body — CreateTaskDto. */
export const createTaskSchema = z.object({
  title: field(z.string().min(1, "Title is required").max(20), {
    type: "text",
    label: "Title",
    placeholder: "Ship contracts package",
    required: true,
    order: 1,
  }),
  description: field(z.string().max(2000).optional(), {
    type: "textarea",
    label: "Description",
    placeholder: "Optional details…",
    required: false,
    order: 2,
  }),
  status: field(taskStatusSchema.default(ETaskStatus.TODO), {
    type: "select",
    label: "Status",
    required: true,
    order: 3,
    options: [
      { label: "To do", value: ETaskStatus.TODO },
      { label: "In progress", value: ETaskStatus.IN_PROGRESS },
      { label: "Done", value: ETaskStatus.DONE },
    ],
  }),
  progress: field(z.coerce.number().min(0).max(100).default(0), {
    type: "number",
    label: "Progress",
    required: false,
    order: 4,
  }),
  assigneeId: field(
    z.preprocess(
      (v) => (v === "" ? null : v),
      z.string().uuid().nullable().optional(),
    ),
    {
      type: "select",
      label: "Assignee",
      placeholder: "Select a user…",
      required: false,
      order: 5,
    },
  ),
});

/** PATCH /tasks/:id body — UpdateTaskDto. */
export const updateTaskSchema = createTaskSchema.partial();

/** Partial update that only changes status. */
export const updateTaskStatusSchema = z.object({
  status: field(taskStatusSchema, {
    type: "select",
    label: "Status",
    required: true,
    order: 1,
    options: [
      { label: "To do", value: ETaskStatus.TODO },
      { label: "In progress", value: ETaskStatus.IN_PROGRESS },
      { label: "Done", value: ETaskStatus.DONE },
    ],
  }),
});

/** GET /tasks/:id (and list item) — TaskDto. */
export const taskSchema = createTaskSchema.extend({
  id: z.string().uuid(),
  /** Read-side enrichment; create/update keep assigneeId. */
  assignee: taskAssigneeSchema.nullish(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** GET /tasks query — TaskListDto (filters use field() for SchemaFilters). */
export const taskListQuerySchema = listQuerySchema.extend({
  status: field(taskStatusSchema.optional(), {
    type: "select",
    label: "Status",
    placeholder: "All statuses",
    order: 2,
    filter: "eq",
    options: [
      { label: "Any", value: "__any__" },
      { label: "To do", value: ETaskStatus.TODO },
      { label: "In progress", value: ETaskStatus.IN_PROGRESS },
      { label: "Done", value: ETaskStatus.DONE },
    ],
  }),
  assigneeId: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      z.string().uuid().optional(),
    ),
    {
      type: "select",
      label: "Assignee",
      placeholder: "Anyone",
      order: 3,
      filter: "eq",
    },
  ),
});

/** GET /tasks response — TaskPaginatedDto. */
export const paginatedTasksSchema = createPaginatedSchema(taskSchema);

/** POST /tasks/bulk-delete body. */
export const deleteManyTasksSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one task"),
});
