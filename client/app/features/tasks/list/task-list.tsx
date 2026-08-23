import { useState } from "react";
import type { IPaginatedTasks } from "@template/contracts";
import { Alert, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { TaskRow } from "../components";
import { TaskFilters } from "./task-filters";

/**
 * listTasks.component — page chrome via `Page`; list props in, actions via store.
 */
export function TaskList({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const createTask = useOp(store, "createTask");
  const viewTask = useOp(store, "viewTask");
  const updateTask = useOp(store, "updateTask");
  const deleteTask = useOp(store, "deleteTask");
  const deleteTasks = useOp(store, "deleteTasks");
  const updateStatus = useOp(store, "updateStatus");
  const markDone = useOp(store, "markDone");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (createTask.kind !== "mutation") return null;
  if (viewTask.kind !== "mutation") return null;
  if (updateTask.kind !== "mutation") return null;
  if (deleteTask.kind !== "mutation") return null;
  if (deleteTasks.kind !== "mutation") return null;
  if (updateStatus.kind !== "mutation") return null;
  if (markDone.kind !== "mutation") return null;

  const pageData = data as IPaginatedTasks | undefined;
  const tasks = pageData?.data ?? [];
  const meta = pageData;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? "Failed to load tasks"
        : null;

  const allSelected =
    tasks.length > 0 && tasks.every((t) => selectedIds.includes(t.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <Page
      title="Tasks"
      description="Manage tasks — list props in; other actions via the ops store."
      actions={
        <>
          {deleteTasks.allowed && selectedIds.length > 0 ? (
            <>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  void deleteTasks
                    .run({ ids: selectedIds })
                    .then(() => setSelectedIds([]))
                    .catch(() => {
                      /* cancelled or failed */
                    });
                }}
              >
                Delete selected ({selectedIds.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </Button>
            </>
          ) : null}
          {createTask.allowed ? (
            <Button type="button" onClick={() => createTask.open()}>
              New task
            </Button>
          ) : null}
        </>
      }
    >
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading tasks…</p>
      ) : null}

      {errorMessage ? (
        <Alert title="Couldn’t load tasks" tone="danger">
          {errorMessage}. Start the API with <code>pnpm start</code> then
          refresh.
        </Alert>
      ) : null}

      <TaskFilters params={params} setParams={setParams} store={store} />

      {deleteTasks.allowed && tasks.length > 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => {
              if (allSelected) setSelectedIds([]);
              else setSelectedIds(tasks.map((t) => t.id));
            }}
            aria-label="Select all tasks on page"
          />
          <span>Select all on page</span>
        </div>
      ) : null}

      <List
        items={tasks}
        getItemKey={(task) => task.id}
        empty={
          !isPending && !errorMessage ? (
            <p className="text-sm text-muted-foreground">No tasks yet.</p>
          ) : null
        }
        renderItem={(task) => (
          <TaskRow
            task={task}
            selected={deleteTasks.allowed ? selectedIds.includes(task.id) : false}
            onToggle={
              deleteTasks.allowed
                ? () => toggleSelected(task.id)
                : () => undefined
            }
            onView={viewTask.allowed ? () => viewTask.open(task) : undefined}
            onEdit={updateTask.allowed ? () => updateTask.open(task) : undefined}
            onUpdateStatus={
              updateStatus.allowed ? () => updateStatus.open(task) : undefined
            }
            onMarkDone={
              markDone.allowed
                ? () => {
                    void markDone
                      .run({ id: task.id, title: task.title })
                      .catch(() => {});
                  }
                : undefined
            }
            onDelete={
              deleteTask.allowed
                ? () => {
                    void deleteTask
                      .run({ id: task.id, title: task.title })
                      .catch(() => {});
                  }
                : undefined
            }
          />
        )}
      />

      {meta ? (
        <ListPagination
          meta={meta}
          pageItemCount={tasks.length}
          selectedCount={selectedIds.length}
          isLoading={isPending}
          mode="bar"
          onPageChange={(page) => setParams({ ...params, page })}
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </Page>
  );
}

