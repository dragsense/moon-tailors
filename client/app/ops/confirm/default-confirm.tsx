import { Confirm } from "~/components/layout-ui";
import type { OpConfirmProps } from "../create-ops";

/** Built-in confirm dialog when `confirm: true` or `confirm: { … }` without `component`. */
export function DefaultOpConfirm({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone,
  busy,
  error,
  onConfirm,
  onCancel,
}: OpConfirmProps) {
  return (
    <Confirm
      open
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      busy={busy}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
