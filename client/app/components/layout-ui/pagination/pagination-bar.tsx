import { useId, useMemo, useTransition } from "react";
import type { IPaginationMeta } from "@template/contracts";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

export type PaginationBarProps = {
  meta: IPaginationMeta;
  /** Items visible on the current page (for "X of Y rows"). */
  pageItemCount: number;
  /** Selected rows on the current page — omit when selection is unused. */
  selectedCount?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  className?: string;
};

/**
 * Full pagination bar* Rows-per-page select, page X of Y, first/prev/next/last.
 */
export function PaginationBar({
  meta,
  pageItemCount,
  selectedCount,
  pageSizeOptions = [5, 10, 20, 30, 40, 50],
  onPageChange,
  onLimitChange,
  className,
}: PaginationBarProps) {
  const componentId = useId();
  const [, startTransition] = useTransition();
  const sizes = useMemo(() => pageSizeOptions, [pageSizeOptions]);

  const handlePageChange = (page: number) => {
    startTransition(() => onPageChange(page));
  };

  const handleLimitChange = (limit: number) => {
    startTransition(() => {
      onLimitChange(limit);
      onPageChange(1);
    });
  };

  const summary =
    selectedCount != null && selectedCount > 0
      ? `${selectedCount} of ${meta.total} row${meta.total === 1 ? "" : "s"} selected`
      : `${pageItemCount} of ${meta.total} row${meta.total === 1 ? "" : "s"}`;

  return (
    <div
      className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
      data-component-id={componentId}
    >
      <p className="text-sm text-muted-foreground">{summary}</p>

      <div className="flex flex-wrap items-center gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${meta.limit}`}
            onValueChange={(value) => handleLimitChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={meta.limit} />
            </SelectTrigger>
            <SelectContent side="top">
              {sizes.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="min-w-[100px] text-center text-sm font-medium">
          Page {meta.page} of {meta.lastPage}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:inline-flex"
            onClick={() => handlePageChange(1)}
            disabled={!meta.hasPrevPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={!meta.hasPrevPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={!meta.hasNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden h-8 w-8 lg:inline-flex"
            onClick={() => handlePageChange(meta.lastPage)}
            disabled={!meta.hasNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
