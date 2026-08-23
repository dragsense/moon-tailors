import type { ReactNode } from "react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type AlertTone = "default" | "info" | "success" | "warning" | "danger";

function toneToVariant(tone: AlertTone): "default" | "destructive" {
  return tone === "danger" ? "destructive" : "default";
}

export type AlertCalloutProps = {
  title?: string;
  children: ReactNode;
  tone?: AlertTone;
  className?: string;
  actions?: ReactNode;
};

/** Inline callout alert — shadcn Alert wrapper. */
export function AlertCallout({
  title,
  children,
  tone = "default",
  className,
  actions,
}: AlertCalloutProps) {
  return (
    <Alert variant={toneToVariant(tone)} className={className}>
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
      {actions ? <AlertAction>{actions}</AlertAction> : null}
    </Alert>
  );
}

export type AlertBannerProps = {
  title?: string;
  children: ReactNode;
  tone?: AlertTone;
  className?: string;
  actions?: ReactNode;
  onDismiss?: () => void;
};

/** Full-width banner alert for page-level notices. */
export function AlertBanner({
  title,
  children,
  tone = "info",
  className,
  actions,
  onDismiss,
}: AlertBannerProps) {
  return (
    <Alert
      variant={toneToVariant(tone)}
      className={cn(
        "rounded-none border-x-0 border-t-0 px-4 py-2.5",
        className,
      )}
    >
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{children}</AlertDescription>
      {(actions || onDismiss) && (
        <AlertAction className="flex items-center gap-2">
          {actions}
          {onDismiss ? (
            <Button type="button" variant="link" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </AlertAction>
      )}
    </Alert>
  );
}
