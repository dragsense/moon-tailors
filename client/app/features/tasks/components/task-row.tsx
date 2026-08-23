import type { ITask } from "@template/contracts";
import { CardRow } from "~/components/layout-ui";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { useI18n } from "~/hooks/use-i18n";
import { useOp } from "~/ops";
import {
  formatDateTimeWithSettings,
  settingsOps,
} from "~/features/settings";

export type TaskRowProps = {
  task: ITask;
  selected: boolean;
  onToggle: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onUpdateStatus?: () => void;
  onMarkDone?: () => void;
  onDelete?: () => void;
};

/** Shared task card — list / view. */
export function TaskRow({
  task,
  selected,
  onToggle,
  onView,
  onEdit,
  onUpdateStatus,
  onMarkDone,
  onDelete,
}: TaskRowProps) {
  const { intlLocale } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const prefsData = mySettings.kind === "query" ? mySettings.data : undefined;
  return (
    <CardRow
      title={
        onView ? (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 text-left font-medium"
            onClick={onView}
          >
            {task.title}
          </Button>
        ) : (
          <span className="font-medium">{task.title}</span>
        )
      }
      leading={
        <Checkbox
          checked={selected}
          onCheckedChange={onToggle}
          aria-label={`Select ${task.title}`}
        />
      }
      actions={
        <>
          {onUpdateStatus ? (
            <Badge
              variant="secondary"
              className="cursor-pointer"
              title="Update status"
              onClick={onUpdateStatus}
            >
              {task.status}
            </Badge>
          ) : (
            <Badge variant="secondary">{task.status}</Badge>
          )}
          {onView ? (
            <Button type="button" variant="outline" size="sm" onClick={onView}>
              View
            </Button>
          ) : null}
          {onEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
          {onUpdateStatus ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onUpdateStatus}
            >
              Status
            </Button>
          ) : null}
          {onMarkDone ? (
            <Button type="button" variant="outline" size="sm" onClick={onMarkDone}>
              Done
            </Button>
          ) : null}
          {onDelete ? (
            <Button type="button" variant="outline" size="sm" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </>
      }
    >
      {task.description ? (
        <p className="text-sm text-muted-foreground">{task.description}</p>
      ) : null}
      <p
        className={
          task.description
            ? "mt-2 text-xs text-muted-foreground"
            : "text-xs text-muted-foreground"
        }
      >
        {formatDateTimeWithSettings(task.createdAt, prefsData, intlLocale)}
      </p>
    </CardRow>
  );
}
