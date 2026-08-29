import { useId, useMemo, useTransition } from "react";
import type { IPaginationMeta } from "@moon-tailors/contracts";
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
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";

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
 * Full pagination bar — compact on small screens, full labels on large.
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
  const { t } = useI18n();
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

  const shown =
    selectedCount != null && selectedCount > 0 ? selectedCount : pageItemCount;
  const rowsLabel = t("common.pagination.rows", {
    shown,
    total: meta.total,
  });
  const pageLabel = t("common.pagination.page", {
    page: meta.page,
    last: meta.lastPage,
  });
  const pageShortLabel = t("common.pagination.pageShort", {
    page: meta.page,
    last: meta.lastPage,
  });

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-2",
        className,
      )}
      data-component-id={componentId}
    >
      <p className="min-w-0 truncate text-xs text-muted-foreground sm:text-sm">
        {rowsLabel}
      </p>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <p className="hidden text-sm font-medium lg:block">
            {t("common.pagination.rowsPerPage")}
          </p>
          <Select
            value={`${meta.limit}`}
            onValueChange={(value) => handleLimitChange(Number(value))}
          >
            <SelectTrigger
              className="h-8 w-[4.25rem]"
              aria-label={t("common.pagination.rowsPerPage")}
            >
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

        <p className="shrink-0 text-xs font-medium sm:text-sm">
          <span className="sm:hidden">{pageShortLabel}</span>
          <span className="hidden sm:inline">{pageLabel}</span>
        </p>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:inline-flex"
            onClick={() => handlePageChange(1)}
            disabled={!meta.hasPrevPage}
          >
            <span className="sr-only">{t("common.pagination.first")}</span>
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(meta.page - 1)}
            disabled={!meta.hasPrevPage}
          >
            <span className="sr-only">{t("common.pagination.previous")}</span>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(meta.page + 1)}
            disabled={!meta.hasNextPage}
          >
            <span className="sr-only">{t("common.pagination.next")}</span>
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:inline-flex"
            onClick={() => handlePageChange(meta.lastPage)}
            disabled={!meta.hasNextPage}
          >
            <span className="sr-only">{t("common.pagination.last")}</span>
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
