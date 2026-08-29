import type { HTMLAttributes, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { cn } from "~/lib/utils";

export type ModalDialogProps = {
  open?: boolean;
  title: ReactNode;
  description?: string;
  onClose: () => void;
  /** Extra message under body (e.g. mutation error). */
  error?: string | null;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** When false, overlay click does not close. Default true. */
  closeOnOverlay?: boolean;
  headerActions?: ReactNode;
  /** Keep title for assistive tech only (no visible dialog heading). */
  hideTitle?: boolean;
};

/** Centered dialog modal — shadcn Dialog wrapper. */
export function ModalDialog({
  open = true,
  title,
  description,
  onClose,
  error,
  children,
  className,
  contentClassName,
  closeOnOverlay = true,
  headerActions,
  hideTitle = false,
}: ModalDialogProps) {
  const showHeader = !hideTitle || Boolean(description) || Boolean(headerActions);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={cn("gap-4 sm:max-w-lg", className)}
        onInteractOutside={(event) => {
          if (!closeOnOverlay) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (!closeOnOverlay) event.preventDefault();
        }}
      >
        {showHeader ? (
          <DialogHeader className="gap-2 pr-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <DialogTitle className={hideTitle ? "sr-only" : undefined}>
                  {title}
                </DialogTitle>
                {description ? (
                  <DialogDescription>{description}</DialogDescription>
                ) : null}
              </div>
              {headerActions ? (
                <div className="flex shrink-0 items-center gap-1">{headerActions}</div>
              ) : null}
            </div>
          </DialogHeader>
        ) : (
          <DialogTitle className="sr-only">{title}</DialogTitle>
        )}
        <div className={cn(contentClassName)}>
          {children}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type ModalSheetProps = {
  open?: boolean;
  title: ReactNode;
  description?: string;
  onClose: () => void;
  error?: string | null;
  children: ReactNode;
  className?: string;
  side?: "right" | "left";
};

/** Edge sheet modal — shadcn Sheet wrapper. */
export function ModalSheet({
  open = true,
  title,
  description,
  onClose,
  error,
  children,
  className,
  side = "right",
}: ModalSheetProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent side={side} className={cn("flex w-full flex-col sm:max-w-md", className)}>
        <SheetHeader className="border-b pb-4">
          <SheetTitle>{title}</SheetTitle>
          {description ? <SheetDescription>{description}</SheetDescription> : null}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4">
          {children}
          {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Overlay-free surface (rare full-page modal host). */
export type ModalSurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function ModalSurface({
  children,
  className,
  ...rest
}: ModalSurfaceProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)} {...rest}>
      {children}
    </div>
  );
}
