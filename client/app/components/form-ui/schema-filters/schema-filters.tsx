import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  useSchemaFilters,
  type SchemaFieldMap,
  type UseSchemaFiltersOptions,
} from "~/lib/form";
import { cn } from "~/lib/utils";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type SchemaFiltersRenderCtx<TSchema extends AnyZodObject> = {
  /** Generated controls — place in any layout. */
  fields: SchemaFieldMap;
  form: UseFormReturn<z.infer<TSchema>>;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

export type SchemaFiltersProps<TSchema extends AnyZodObject> =
  UseSchemaFiltersOptions<TSchema> & {
    /**
 * Custom body. You own layout + clear UI.
 * If omitted, filter fields wrap in a row with an optional Clear button.
 */
    children?: (ctx: SchemaFiltersRenderCtx<TSchema>) => ReactNode;
    /** Auto-layout only: show Clear when filters active (default true). */
    showClear?: boolean;
    clearLabel?: string;
    className?: string;
  };

/**
 * Schema-driven list filter bar (same flexibility as SchemaForm).
 *
 * ```tsx
 * <SchemaFilters
 * schema={taskListQuerySchema}
 * values={params}
 * onChange={(filters) => setParams({ ...params, ...filters, page: 1,
 * // drop cleared keys:
 * search: filters.search, status: filters.status })}
 * fieldConfig={{
 * search: { placeholder: "Search tasks…" },
 * status: {
 * render: ({ field, meta }) => <MyStatusChips … />,
 * },
 * }}
 * >
 * {({ fields, hasActiveFilters, clearFilters }) => (
 * <div className="flex flex-wrap items-end gap-2">
 * {fields.search}
 * {fields.status}
 * {hasActiveFilters ? <Button onClick={clearFilters}>Clear</Button> : null}
 * </div>
 * )}
 * </SchemaFilters>
 * ```
 */
export function SchemaFilters<TSchema extends AnyZodObject>({
  schema,
  values,
  onChange,
  debounceMs,
  names,
  fieldConfig,
  children,
  showClear = true,
  clearLabel = "Clear filters",
  className,
}: SchemaFiltersProps<TSchema>) {
  const { form, fields, hasActiveFilters, clearFilters } = useSchemaFilters({
    schema,
    values,
    onChange,
    debounceMs,
    names,
    fieldConfig,
  });

  const ctx: SchemaFiltersRenderCtx<TSchema> = {
    fields,
    form,
    hasActiveFilters,
    clearFilters,
  };

  return (
    <div className={cn(className)}>
      {children ? (
        children(ctx)
      ) : (
        <div className="flex flex-1 flex-wrap items-end gap-2">
          {Object.values(fields)}
          {showClear && hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              {clearLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
