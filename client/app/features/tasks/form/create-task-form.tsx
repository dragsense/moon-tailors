import type { TCreateTaskData } from "@template/contracts";
import { ETaskStatus, createTaskSchema } from "@template/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { OpsComponent, type OpsStore } from "~/ops";

export type CreateTaskFormProps = {
  store: OpsStore;
  onSubmit: (values: TCreateTaskData) => void | Promise<void>;
  /** Disable submit while mutation is in flight (modal slot isPending). */
  busy?: boolean;
  defaultValues?: Partial<TCreateTaskData>;
  /**
   * Optional remote options for title (e.g. user names / templates).
   * When provided, title becomes a select; otherwise stock text field.
   */
  titleOptions?: { label: string; value: string }[];
};

/**
 * Shared create-task fields. No modal/page shell — wrappers own chrome.
 *
 * Schema owns validation + default meta. `fieldConfig` owns instance UI:
 * labels, remote options, hide/disable, custom controls.
 * Assignee uses `listUsersDropdown` via OpsComponent `field`.
 */
export function CreateTaskForm({
  store,
  onSubmit,
  busy = false,
  defaultValues,
  titleOptions,
}: CreateTaskFormProps) {
  return (
    <SchemaForm
      schema={createTaskSchema}
      defaultValues={{ status: ETaskStatus.TODO, ...defaultValues }}
      fieldConfig={{
        ...(titleOptions?.length
          ? {
              title: {
                type: "select" as const,
                label: "Title",
                placeholder: "Pick from list…",
                options: titleOptions,
              },
            }
          : {}),
        progress: {
          label: "",
          // Example: UI depends on another field
          hidden: (v) => v.status === ETaskStatus.TODO,
          disabled: (v) => v.status === ETaskStatus.DONE,
          placeholder: "0–100",
        },
        assigneeId: {
          render: ({ field, error, disabled, meta }) => (
            <OpsComponent
              store={store}
              name="listUsersDropdown"
              field={{
                name: String(field.name),
                value: field.value,
                onChange: field.onChange,
                onBlur: field.onBlur,
                disabled,
                error,
                label: meta.label,
              }}
            />
          ),
        },
      }}
      onSubmit={onSubmit}
    >
      {({ fields, isSubmitting }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.title}
            {fields.status}
          </div>
          {fields.description}
          {fields.progress}
          {fields.assigneeId}
          <Button type="submit" disabled={isSubmitting || busy}>
            {isSubmitting || busy ? "Saving…" : "Create task"}
          </Button>
        </div>
      )}
    </SchemaForm>
  );
}
