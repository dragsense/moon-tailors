import type { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export type ConfirmTone = "destructive" | "default" | "secondary";

export type ConfirmCardProps = {
  open?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  busyLabel?: string;
  error?: string | null;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
  children?: ReactNode;
};

/** Card confirm dialog — shadcn Dialog wrapper. */
export function ConfirmCard({
  open = true,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  busyLabel = "Working…",
  error = null,
  tone = "destructive",
  onConfirm,
  onCancel,
  className,
  children,
}: ConfirmCardProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <DialogContent className={cn("sm:max-w-md", className)} showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {(error || children) && (
          <div className="space-y-2">
            {children}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        )}
        <DialogFooter className="border-t-0 bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={tone} onClick={onConfirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export type ConfirmInlineProps = {
  open?: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string | null;
  tone?: ConfirmTone;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
};

/** Inline confirm strip — no overlay. */
export function ConfirmInline({
  open = true,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  error = null,
  tone = "default",
  onConfirm,
  onCancel,
  className,
}: ConfirmInlineProps) {
  if (!open) return null;

  return (
    <div
      className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}
      role="alertdialog"
      aria-labelledby="confirm-inline-title"
    >
      <h3 id="confirm-inline-title" className="text-sm font-semibold">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={busy}
        >
          {cancelLabel}
        </Button>
        <Button type="button" variant={tone} size="sm" onClick={onConfirm} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
