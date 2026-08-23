import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export type CardPanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Header trailing slot (e.g. badge, close). */
  action?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
  size?: "default" | "sm";
};

/**
 * Vertical content card — forms, empty states, page sections.
 * Title / description / body / footer, shared app style.
 */
export function CardPanel({
  title,
  description,
  action,
  children,
  footer,
  className,
  contentClassName,
  footerClassName,
  size = "default",
}: CardPanelProps) {
  const hasHeader = title != null || description != null || action != null;

  return (
    <Card size={size} className={className}>
      {hasHeader ? (
        <CardHeader>
          {title != null ? <CardTitle>{title}</CardTitle> : null}
          {description != null ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
          {action != null ? <CardAction>{action}</CardAction> : null}
        </CardHeader>
      ) : null}
      {children != null ? (
        <CardContent className={cn(contentClassName)}>{children}</CardContent>
      ) : null}
      {footer != null ? (
        <CardFooter className={cn(footerClassName)}>{footer}</CardFooter>
      ) : null}
    </Card>
  );
}
