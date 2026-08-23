/**
 * Task ops catalog — all ops + default UI.
 * Not a store. Packs spread/pick from here; override only if needed.
 * Schemas live on SchemaForm / contracts — not here.
 *
 * @example Keep core refresh + host refresh
 * ...pickOps(taskOpsCore, {
 *   createTask: {
 *     onSuccess: composeSuccess(
 *       taskOpsCore.createTask.onSuccess,
 *       (_r, _v, ops) => refetchOp(ops, "listUsers"),
 *     ),
 *   },
 *   viewTask: true,
 * })
 */
import type { TCreateTaskData, TUpdateTaskData, TUpdateTaskStatusData } from "@template/contracts";
import { EPermissionAction, EResource, ETaskStatus } from "@template/contracts";
import {
  invalidateQueriesKey,
  refetchOp,
  type OpConfig,
  type OpsBag,
} from "~/ops";
import { tasksService } from "../api";
import { taskKeys } from "../query-keys";
import { CreateTaskModal } from "../form/create-task-modal";
import { UpdateStatusForm } from "../form/update-status";
import { UpdateTaskForm } from "../form/update-task";
import { TaskList } from "../list/task-list";
import { ViewTaskModal } from "../view";

/** Refresh task lists everywhere — mounted pack + domain cache. */
const onSuccess = (_r: unknown, _v: unknown, ops: OpsBag) => {
  refetchOp(ops, "listTasks");
  invalidateQueriesKey(taskKeys.lists());
};

export const taskOpsCore = {
  listTasks: {
    kind: "query" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.READ },
    initialParams: { page: 1, limit: 20 },
    queryKey: taskKeys.list,
    invalidateKey: taskKeys.lists(),
    fetch: (params: Record<string, unknown>) =>
      tasksService.list({
        page: Number(params.page ?? 1),
        limit: Number(params.limit ?? 20),
        search:
          typeof params.search === "string" ? params.search : undefined,
        status:
          typeof params.status === "string"
            ? (params.status as ETaskStatus)
            : undefined,
        assigneeId:
          typeof params.assigneeId === "string" ? params.assigneeId : undefined,
      }),
    component: TaskList,
    auto: false,
    onError: (error: Error) => {
      console.error("[tasks.listTasks]", error.message);
    },
  },
  createTask: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.CREATE },
    mutate: (body: unknown) => tasksService.create(body as TCreateTaskData),
    component: CreateTaskModal,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.createTask]", error.message);
    },
  },
  viewTask: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.READ },
    mutate: async (vars: unknown) => vars,
    component: ViewTaskModal,
    auto: true,
  },
  updateTask: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.UPDATE },
    mutate: (vars: unknown) => {
      const { id, body } = vars as { id: string; body: TUpdateTaskData };
      return tasksService.update(id, body);
    },
    component: UpdateTaskForm,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.updateTask]", error.message);
    },
  },
  deleteTask: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.DELETE },
    confirm: {
      title: "Delete task",
      description: (vars: unknown) => {
        const v = vars as { title?: string };
        return v.title
          ? `Delete “${v.title}” permanently?`
          : "Delete this task permanently?";
      },
      confirmLabel: "Delete",
      tone: "destructive" as const,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return tasksService.remove(id);
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.deleteTask]", error.message);
    },
  },
  deleteTasks: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.DELETE },
    confirm: {
      title: "Delete selected tasks",
      description: (vars: unknown) => {
        const n = (vars as { ids: string[] }).ids?.length ?? 0;
        return `Delete ${n} task${n === 1 ? "" : "s"} permanently?`;
      },
      confirmLabel: "Delete",
      tone: "destructive" as const,
    },
    mutate: (vars: unknown) => {
      const { ids } = vars as { ids: string[] };
      return tasksService.removeMany(ids);
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.deleteTasks]", error.message);
    },
  },
  updateStatus: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.UPDATE },
    mutate: (vars: unknown) => {
      const { id, body } = vars as {
        id: string;
        body: TUpdateTaskStatusData;
      };
      return tasksService.updateStatus(id, body);
    },
    component: UpdateStatusForm,
    auto: true,
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.updateStatus]", error.message);
    },
  },
  markDone: {
    kind: "mutation" as const,
    permission: { resource: EResource.TASKS, action: EPermissionAction.UPDATE },
    confirm: {
      title: "Mark as done",
      description: (vars: unknown) => {
        const v = vars as { title?: string };
        return v.title
          ? `Mark “${v.title}” as done?`
          : "Mark this task as done?";
      },
      confirmLabel: "Mark done",
      tone: "default" as const,
    },
    mutate: (vars: unknown) => {
      const { id } = vars as { id: string };
      return tasksService.updateStatus(id, { status: ETaskStatus.DONE });
    },
    onSuccess,
    onError: (error: Error) => {
      console.error("[tasks.markDone]", error.message);
    },
  },
} satisfies Record<string, OpConfig>;

export type TaskOpsCore = typeof taskOpsCore;
export type TaskOpName = keyof TaskOpsCore;
