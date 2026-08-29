import { EOrderStatus } from "@moon-tailors/contracts";

/** Card that reads against page and modal surfaces. Late jobs get a reddish wash. */
export function orderStatusCardClass(
  status: EOrderStatus,
  delayed?: boolean,
): string {
  const closed =
    status === EOrderStatus.DELIVERED || status === EOrderStatus.CANCELED;
  if (delayed && !closed) {
    return "bg-red-100 shadow-sm ring-1 ring-red-300/80 dark:bg-red-950 dark:ring-red-800";
  }
  return "bg-muted/50 shadow-sm ring-1 ring-border";
}

export function orderStatusBadgeClass(status: EOrderStatus): string {
  switch (status) {
    case EOrderStatus.NEW:
      return "border-transparent bg-indigo-700 text-white";
    case EOrderStatus.STITCHING:
      return "border-transparent bg-orange-700 text-white";
    case EOrderStatus.STITCHED:
      return "border-transparent bg-teal-800 text-white";
    case EOrderStatus.READY:
      return "border-transparent bg-emerald-800 text-white";
    case EOrderStatus.DELIVERED:
      return "border-transparent bg-slate-600 text-white";
    case EOrderStatus.CANCELED:
      return "border-transparent bg-stone-600 text-white";
    default:
      return "border-transparent bg-primary text-primary-foreground";
  }
}

export const paidMoneyClass =
  "font-medium tabular-nums text-emerald-700 dark:text-emerald-400";

export function dueMoneyClass(remaining: number): string {
  return remaining > 0
    ? "font-medium tabular-nums text-red-700 dark:text-red-400"
    : "tabular-nums text-muted-foreground";
}
