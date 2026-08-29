import type { ReactNode } from "react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { cn } from "~/lib/utils";

export type CardRowProps = {
  title: ReactNode;
  /** Left of title (checkbox, avatar, icon). */
  leading?: ReactNode;
  /** Right of title (badges, buttons). */
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
  size?: "default" | "sm";
};

/**
 * Horizontal header card — list rows / dense items.
 * leading | title …… actions
 * body content below.
 */
export function CardRow({
  title,
  leading,
  actions,
  children,
  className,
  headerClassName,
  titleClassName,
  contentClassName,
  size = "default",
}: CardRowProps) {
  return (
    <Card size={size} className={className}>
      <CardHeader
        className={cn("items-center gap-3", headerClassName)}
      >
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <CardTitle
            className={cn("truncate text-base font-medium", titleClassName)}
          >
            {title}
          </CardTitle>
        </div>
        {actions != null ? (
          <CardAction className="self-center">
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:justify-end">
              {actions}
            </div>
          </CardAction>
        ) : null}
      </CardHeader>
      {children != null ? (
        <CardContent className={cn(contentClassName)}>{children}</CardContent>
      ) : null}
    </Card>
  );
}
