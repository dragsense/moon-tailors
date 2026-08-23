import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export type ListItemMeta = {
  key: string;
  selected?: boolean;
};

export type ListStackProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, meta: ListItemMeta) => ReactNode;
  empty?: ReactNode;
  className?: string;
  itemClassName?: string;
  gap?: "sm" | "md" | "lg";
};

const gapClass = {
  sm: "space-y-1.5",
  md: "space-y-3",
  lg: "space-y-5",
} as const;

/**
 * Vertical stack list — default list version (spanned items).
 * Rendering is 100% via `renderItem`.
 */
export function ListStack<T>({
  items,
  getItemKey,
  renderItem,
  empty,
  className,
  itemClassName,
  gap = "md",
}: ListStackProps<T>) {
  if (items.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <ul className={cn(gapClass[gap], className)}>
      {items.map((item, index) => {
        const key = getItemKey(item, index);
        return (
          <li key={key} className={itemClassName}>
            {renderItem(item, { key, selected: false })}
          </li>
        );
      })}
    </ul>
  );
}

export type ListDividedProps<T> = {
  items: T[];
  getItemKey: (item: T, index: number) => string;
  renderItem: (item: T, meta: ListItemMeta) => ReactNode;
  empty?: ReactNode;
  className?: string;
  itemClassName?: string;
  selectedKeys?: string[];
};

/**
 * Divided list — alternate list with hairline rules between rows.
 */
export function ListDivided<T>({
  items,
  getItemKey,
  renderItem,
  empty,
  className,
  itemClassName,
  selectedKeys = [],
}: ListDividedProps<T>) {
  if (items.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  const selected = new Set(selectedKeys);

  return (
    <ul className={cn("divide-y rounded-lg border", className)}>
      {items.map((item, index) => {
        const key = getItemKey(item, index);
        const isSelected = selected.has(key);
        return (
          <li
            key={key}
            className={cn(
              "px-3 py-3",
              isSelected && "bg-muted/40",
              itemClassName,
            )}
          >
            {renderItem(item, { key, selected: isSelected })}
          </li>
        );
      })}
    </ul>
  );
}
