import type { ITask } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useMaybeOp, type MutationOpComponentProps } from "~/ops";
import { TaskDetail } from "./task-detail";

function taskFromPayload(payload: unknown): ITask | null {
  if (payload && typeof payload === "object" && "id" in payload) {
    return payload as ITask;
  }
  return null;
}

/**
 * viewTask.component — read-only detail modal.
 * Edit is shown only when the host pack also has `updateTask` (useMaybeOp).
 */
export function ViewTaskModal({
  isOpen,
  payload,
  close,
  store,
}: MutationOpComponentProps) {
  const updateTask = useMaybeOp(store, "updateTask");
  const task = taskFromPayload(payload);

  if (!isOpen || !task) return null;

  return (
    <Modal title={task.title} description="Task details" onClose={close}>
      <TaskDetail task={task} />
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={close}>
          Close
        </Button>
        {updateTask?.kind === "mutation" ? (
          <Button
            type="button"
            onClick={() => {
              close();
              updateTask.open(task);
            }}
          >
            Edit
          </Button>
        ) : null}
      </div>
    </Modal>
  );
}
