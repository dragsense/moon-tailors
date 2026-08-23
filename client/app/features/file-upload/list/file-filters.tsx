import type { TFileListQuery } from "@template/contracts";
import {
  LIST_QUERY_INTERNAL_KEYS,
  fileListQuerySchema,
} from "@template/contracts";
import { SchemaFilters } from "~/components/form-ui";
import { Button } from "~/components/ui/button";

export type FileFiltersProps = {
  params: Record<string, unknown>;
  setParams: (next: Record<string, unknown>) => void;
};

/**
 * File list filters — schema-driven (search + type).
 * Folder is owned by the sidebar, not this bar.
 */
export function FileFilters({ params, setParams }: FileFiltersProps) {
  const applyFilters = (filters: Partial<TFileListQuery>) => {
    const next: Record<string, unknown> = {
      page: 1,
      limit: params.limit ?? 20,
      folder: params.folder,
    };
    for (const key of LIST_QUERY_INTERNAL_KEYS) {
      if (key === "page" || key === "limit") continue;
      if (params[key] !== undefined) next[key] = params[key];
    }
    Object.assign(next, filters);
    if (params.folder !== undefined) next.folder = params.folder;
    setParams(next);
  };

  return (
    <SchemaFilters
      schema={fileListQuerySchema}
      values={params as Partial<TFileListQuery>}
      onChange={applyFilters}
      names={["search", "type"]}
      fieldConfig={{
        search: {
          placeholder: "Search files…",
        },
        type: {
          label: "Type",
        },
      }}
    >
      {({ fields, hasActiveFilters, clearFilters }) => (
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">{fields.search}</div>
          <div className="w-full sm:w-44">{fields.type}</div>
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
