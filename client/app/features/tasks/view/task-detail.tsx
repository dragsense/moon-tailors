import type { ITask } from "@template/contracts";
import { ETaskStatus } from "@template/contracts";
import { Badge } from "~/components/ui/badge";
import { useI18n } from "~/hooks/use-i18n";
import { useOp } from "~/ops";
import {
  formatDateTimeWithSettings,
  settingsOps,
} from "~/features/settings";

const statusLabel: Record<ETaskStatus, string> = {
  [ETaskStatus.TODO]: "To do",
  [ETaskStatus.IN_PROGRESS]: "In progress",
  [ETaskStatus.DONE]: "Done",
};

export type TaskDetailProps = {
  task: ITask;
};

/** Read-only task fields for modal / page detail. */
export function TaskDetail({ task }: TaskDetailProps) {
  const { intlLocale } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const prefsData = mySettings.kind === "query" ? mySettings.data : undefined;
  return (
    <dl className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <dt className="sr-only">Status</dt>
        <dd>
          <Badge variant="secondary">
            {statusLabel[task.status] ?? task.status}
          </Badge>
        </dd>
        <dt className="sr-only">Progress</dt>
        <dd className="text-muted-foreground">{task.progress}% done</dd>
      </div>

      <div>
        <dt className="text-xs font-medium text-muted-foreground">Title</dt>
        <dd className="mt-1 text-base font-medium">{task.title}</dd>
      </div>

      <div>
        <dt className="text-xs font-medium text-muted-foreground">
          Description
        </dt>
        <dd className="mt-1 whitespace-pre-wrap text-muted-foreground">
          {task.description?.trim() ? task.description : "—"}
        </dd>
      </div>

      <div>
        <dt className="text-xs font-medium text-muted-foreground">Assignee</dt>
        <dd className="mt-1 text-muted-foreground">
          {task.assignee
            ? `${task.assignee.name} (${task.assignee.email})`
            : "—"}
        </dd>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            Created
          </dt>
          <dd className="mt-1">
            {formatDateTimeWithSettings(task.createdAt, prefsData, intlLocale)}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">
            Updated
          </dt>
          <dd className="mt-1">
            {formatDateTimeWithSettings(task.updatedAt, prefsData, intlLocale)}
          </dd>
        </div>
      </div>

      <div>
        <dt className="text-xs font-medium text-muted-foreground">Id</dt>
        <dd className="mt-1 font-mono text-xs text-muted-foreground break-all">
          {task.id}
        </dd>
      </div>
    </dl>
  );
}
