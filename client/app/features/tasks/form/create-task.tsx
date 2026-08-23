import { useNavigate } from "react-router";
import { SurfaceCard } from "~/components/layout-ui";
import { Page } from "~/layouts";
import type { MutationOpComponentProps } from "~/ops";
import { CreateTaskForm } from "./create-task-form";

/**
 * taskCreateOps.createTask component — full page with breadcrumb + form card.
 */
export function CreateTask({
  store,
  isPending,
  isError,
  error,
  submit,
}: MutationOpComponentProps) {
  const navigate = useNavigate();

  return (
    <Page
      title="New task"
      description="Create a task and assign it to a team member."
    >
      <SurfaceCard className="mx-auto max-w-lg">
        <CreateTaskForm
          store={store}
          busy={isPending}
          onSubmit={async (values) => {
            await submit(values);
            navigate("/tasks");
          }}
        />
        {isError ? (
          <p className="mt-3 text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to create task"}
          </p>
        ) : null}
      </SurfaceCard>
    </Page>
  );
}
