import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";

export type TableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};

export type TableSimpleProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  className?: string;
  caption?: string;
};

/** Simple table — shadcn Table wrapper. */
export function TableSimple<T>({
  columns,
  rows,
  getRowKey,
  empty,
  className,
  caption,
}: TableSimpleProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={className}>
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.id} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={getRowKey(row, index)}>
              {columns.map((col) => (
                <TableCell key={col.id} className={col.className}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export type TableDataProps<T> = TableSimpleProps<T> & {
  onRowClick?: (row: T) => void;
  selectedKeys?: string[];
};

/** Data table — shadcn Table with row selection styling. */
export function TableData<T>({
  columns,
  rows,
  getRowKey,
  empty,
  className,
  caption,
  onRowClick,
  selectedKeys = [],
}: TableDataProps<T>) {
  if (rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  const selected = new Set(selectedKeys);

  return (
    <div className={cn("rounded-lg border", className)}>
      <Table>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            {columns.map((col) => (
              <TableHead
                key={col.id}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  col.headerClassName,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const key = getRowKey(row, index);
            const isSelected = selected.has(key);
            return (
              <TableRow
                key={key}
                data-state={isSelected ? "selected" : undefined}
                className={cn(onRowClick && "cursor-pointer")}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <TableCell key={col.id} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
