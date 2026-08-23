import type { TTaskListQuery } from "@template/contracts";
import {
  LIST_QUERY_INTERNAL_KEYS,
  taskListQuerySchema,
} from "@template/contracts";
import { SchemaFilters } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { FieldShell } from "~/lib/form";
import { OpsComponent, type OpsStore } from "~/ops";

export type TaskFiltersProps = {
  params: Record<string, unknown>;
  setParams: (next: Record<string, unknown>) => void;
  /** Ops store — enables custom assignee dropdown (same as create form). */
  store: OpsStore;
};

/**
 * Task list filters — schema-driven.
 *
 * - Schema `field` owns defaults (search, status, assigneeId)
 * - `fieldConfig` overrides labels / custom inputs
 * - children own placement (order, wrap, clear button)
 */
export function TaskFilters({ params, setParams, store }: TaskFiltersProps) {
  const applyFilters = (filters: Partial<TTaskListQuery>) => {
    const next: Record<string, unknown> = {
      page: 1,
      limit: params.limit ?? 20,
    };
    for (const key of LIST_QUERY_INTERNAL_KEYS) {
      if (key === "page" || key === "limit") continue;
      if (params[key] !== undefined) next[key] = params[key];
    }
    Object.assign(next, filters);
    setParams(next);
  };

  return (
    <SchemaFilters
      schema={taskListQuerySchema}
      values={params as Partial<TTaskListQuery>}
      onChange={applyFilters}
      names={["search", "status", "assigneeId"]}
      fieldConfig={{
        search: {
          placeholder: "Search by title or description…",
        },
        status: {
          label: "Status",
        },
        assigneeId: {
          label: "Assignee",
          render: ({ field, error, disabled, meta }) => (
            <FieldShell
              name={String(field.name)}
              label={meta.label}
              error={error}
            >
              <OpsComponent
                store={store}
                name="listUsersDropdown"
                field={{
                  name: String(field.name),
                  value: field.value ?? null,
                  onChange: (value) =>
                    field.onChange(value === null || value === "" ? undefined : value),
                  onBlur: field.onBlur,
                  disabled,
                  error,
                }}
              />
            </FieldShell>
          ),
        },
      }}
    >
      {({ fields, hasActiveFilters, clearFilters }) => (
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">{fields.search}</div>
          <div className="w-full sm:w-44">{fields.status}</div>
          <div className="w-full sm:w-56">{fields.assigneeId}</div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mb-0.5"
              onClick={clearFilters}
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </SchemaFilters>
  );
}
