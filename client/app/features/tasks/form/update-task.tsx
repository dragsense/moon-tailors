import type { ITask } from "@template/contracts";
import { updateTaskSchema } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import { SchemaForm } from "~/components/form-ui";
import { OpsComponent, type MutationOpComponentProps } from "~/ops";

/** updateTask.component — only this mutation’s props (+ payload). */
export function UpdateTaskForm({
  store,
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
      title="Edit task"
      description={`Update “${task.title}”.`}
      onClose={close}
      error={
        isError
          ? error instanceof Error
            ? error.message
            : "Update failed"
          : null
      }
    >
      <SchemaForm
        schema={updateTaskSchema}
        submitLabel="Save changes"
        defaultValues={{
          title: task.title,
          description: task.description,
          status: task.status,
          progress: task.progress,
          assigneeId: task.assigneeId,
        }}
        fieldConfig={{
          assigneeId: {
            render: ({ field, error: fieldError, disabled, meta }) => (
              <OpsComponent
                store={store}
                name="listUsersDropdown"
                field={{
                  name: String(field.name),
                  value: field.value,
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  disabled,
                  error: fieldError,
                  label: meta.label,
                  selectedOption: task.assignee
                    ? {
                        value: task.assignee.id,
                        label: task.assignee.name,
                        description: task.assignee.email,
                      }
                    : undefined,
                }}
              />
            ),
          },
        }}
        onSubmit={async (values) => {
          await submit({ id: task.id, body: values });
          close();
        }}
      />
    </Modal>
  );
}
