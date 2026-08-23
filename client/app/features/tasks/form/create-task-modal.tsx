import { Modal } from "~/components/layout-ui";
import type { MutationOpComponentProps } from "~/ops";
import { CreateTaskForm } from "./create-task-form";

/** createTask.component — modal shell around shared CreateTaskForm. */
export function CreateTaskModal({
  store,
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  if (!isOpen) return null;

  return (
    <Modal
      title="New task"
      description="Create a task."
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Create failed"
          : null
      }
    >
      <CreateTaskForm
        store={store}
        busy={isPending}
        onSubmit={async (values) => {
          await submit(values);
          close();
        }}
      />
    </Modal>
  );
}
