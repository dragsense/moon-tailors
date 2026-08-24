import type { IPaginationMeta } from "@moon-tailors/contracts";
import { Loader2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { PaginationBar, type PaginationBarProps } from "./pagination-bar";

export type ListPaginationMode = "bar" | "load-more" | "none";

export type ListPaginationProps = {
  meta: IPaginationMeta;
  pageItemCount: number;
  selectedCount?: number;
  isLoading?: boolean;
  /** `bar` — full controls; `load-more` — next-page button; `none` — hidden. */
  mode?: ListPaginationMode;
  pageSizeOptions?: PaginationBarProps["pageSizeOptions"];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
};

/**
 * List footer pagination*/
export function ListPagination({
  meta,
  pageItemCount,
  selectedCount,
  isLoading = false,
  mode = "bar",
  pageSizeOptions,
  onPageChange,
  onLimitChange,
  className,
}: ListPaginationProps) {
  if (mode === "none" || meta.total === 0 || pageItemCount === 0) {
    return null;
  }

  if (mode === "load-more") {
    if (!meta.hasNextPage) return null;

    return (
      <div className={`flex justify-center border-t pt-6 ${className ?? ""}`}>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => onPageChange(meta.page + 1)}
        >
          {isLoading ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </>
          ) : (
            "Load more"
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className={`border-t pt-6 ${className ?? ""}`}>
      <PaginationBar
        meta={meta}
        pageItemCount={pageItemCount}
        selectedCount={selectedCount}
        pageSizeOptions={pageSizeOptions}
        onPageChange={onPageChange}
        onLimitChange={onLimitChange}
      />
    </div>
  );
}
