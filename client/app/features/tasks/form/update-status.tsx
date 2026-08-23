import type { ITask } from "@template/contracts";
import { updateTaskStatusSchema } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { SchemaForm } from "~/components/form-ui";
import type { MutationOpComponentProps } from "~/ops";

/** updateStatus.component — only this mutation’s props (+ payload). */
export function UpdateStatusForm({
  isOpen,
  payload,
  isError,
  error,
  close,
  submit,
}: MutationOpComponentProps) {
  if (!isOpen) return null;

  const task =
    payload && typeof payload === "object" && "id" in payload
      ? (payload as ITask)
      : null;

  if (!task) return null;

  return (
    <Modal
      title="Update status"
      description={`Change status for “${task.title}”.`}
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Failed to update status"
          : null
      }
      className="max-w-md"
    >
      <SchemaForm
        schema={updateTaskStatusSchema}
        submitLabel="Save status"
        defaultValues={{ status: task.status }}
        onSubmit={async (values) => {
          await submit({ id: task.id, body: values });
          close();
        }}
      />
    </Modal>
  );
}

/** @deprecated alias — prefer UpdateStatusForm */
export const UpdateStatus = UpdateStatusForm;
