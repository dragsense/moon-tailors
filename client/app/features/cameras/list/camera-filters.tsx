import type { TCameraListQuery } from "@template/contracts";
import {
  LIST_QUERY_INTERNAL_KEYS,
  cameraListQuerySchema,
} from "@template/contracts";
import { SchemaFilters } from "~/components/form-ui";
import { Button } from "~/components/ui/button";

export type CameraFiltersProps = {
  params: Record<string, unknown>;
  setParams: (next: Record<string, unknown>) => void;
};

export function CameraFilters({ params, setParams }: CameraFiltersProps) {
  const applyFilters = (filters: Partial<TCameraListQuery>) => {
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
      schema={cameraListQuerySchema}
      values={params as Partial<TCameraListQuery>}
      onChange={applyFilters}
      names={["search", "isActive"]}
      fieldConfig={{
        search: {
          placeholder: "Search cameras…",
        },
        isActive: {
          label: "Status",
        },
      }}
    >
      {({ fields, hasActiveFilters, clearFilters }) => (
        <div className="flex flex-1 flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1 sm:max-w-xs">{fields.search}</div>
          <div className="w-full sm:w-44">{fields.isActive}</div>
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
