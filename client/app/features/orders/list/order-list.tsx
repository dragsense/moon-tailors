import type { IOrder, IPaginatedResponse } from "@moon-tailors/contracts";
import { EOrderStatus } from "@moon-tailors/contracts";
import { Alert, CardRow, List, ListPagination } from "~/components/layout-ui";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  dueMoneyClass,
  orderStatusBadgeClass,
  orderStatusCardClass,
  paidMoneyClass,
} from "../status-style";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import type { TranslationKey } from "~/locales";
import { OrderFilters } from "./order-filters";

function daysLate(readyBy: string): number {
  const due = Date.parse(`${readyBy.slice(0, 10)}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(due) || Number.isNaN(today)) return 0;
  return Math.max(0, Math.round((today - due) / 86_400_000));
}

function statusLabel(
  t: (key: TranslationKey) => string,
  status: EOrderStatus,
) {
  return t(`orders.status.${status}` as TranslationKey);
}

export function OrderList({
  data,
  isPending,
  isError,
  error,
  params,
  setParams,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const view = useOp(store, "viewOrder");
  const updateOrder = useOp(store, "updateOrder");
  const receivePayment = useOp(store, "receiveOrderPayment");
  const page = data as IPaginatedResponse<IOrder> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("orders.loadFailed")
        : null;
  const canUpdate =
    updateOrder.kind === "mutation" && updateOrder.allowed;

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0">
        <OrderFilters
          values={params}
          onChange={(filters) =>
            setParams({
              page: 1,
              limit: params.limit ?? 20,
              customerId: params.customerId,
              search: filters.search,
              status: filters.status,
              delayed: filters.delayed === true ? true : undefined,
            })
          }
        />
      </div>

      {isPending ? (
        <p className="text-muted-foreground shrink-0 text-base">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("orders.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <List
          items={rows}
          getItemKey={(row: IOrder) => row.id}
          empty={
            !isPending && !errorMessage ? (
              <p className="text-muted-foreground text-base">{t("orders.empty")}</p>
            ) : null
          }
          renderItem={(order: IOrder) => (
          <CardRow
            title={
              <>
                {t("orders.numberLabel")}{" "}
                <span className="font-bold">{order.orderNumber}</span>
              </>
            }
            className={orderStatusCardClass(order.status, order.isDelayed)}
            actions={
              <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {canUpdate ? (
                  <Select
                    value={order.status}
                    disabled={updateOrder.isPending}
                    onValueChange={(value) => {
                      const status = value as EOrderStatus;
                      if (status === order.status) return;
                      void updateOrder
                        .run({
                          id: order.id,
                          status,
                          forceEdit: order.isLocked || undefined,
                        })
                        .catch(() => {});
                    }}
                  >
                    <SelectTrigger
                      className="h-9 w-full sm:max-w-[11rem]"
                      aria-label={t("orders.updateStatus")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(EOrderStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel(t, status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
                {receivePayment.kind === "mutation" &&
                receivePayment.allowed &&
                order.remainingAmount > 0 &&
                order.status !== EOrderStatus.CANCELED ? (
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:h-9 sm:w-auto"
                    onClick={() => receivePayment.open(order)}
                  >
                    {t("orders.receivePayment")}
                  </Button>
                ) : null}
                {view.kind === "query" && view.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:h-9 sm:w-auto"
                    onClick={() => view.open(order)}
                  >
                    {t("orders.view")}
                  </Button>
                ) : null}
              </div>
            }
          >
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    className={`h-7 px-3 text-sm ${orderStatusBadgeClass(order.status)}`}
                  >
                    {statusLabel(t, order.status)}
                  </Badge>
                  {order.isDelayed ? (
                    <Badge variant="destructive" className="h-7 px-3 text-sm">
                      {t("orders.delayed")}
                    </Badge>
                  ) : null}
                  {order.isLocked ? (
                    <Badge variant="outline" className="h-7 px-3 text-sm">
                      {t("orders.locked")}
                    </Badge>
                  ) : null}
                </div>
                {order.customer?.name || order.garmentType ? (
                  <p className="text-muted-foreground min-w-0 truncate text-base">
                    {[order.customer?.name, order.garmentType]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                <div className="mt-1 space-y-1 text-sm">
                  <p className="min-w-0 break-words">
                    <span className={paidMoneyClass}>
                      {t("orders.paidAmount")}{" "}
                      {t("orders.money", {
                        amount: order.paidAmount.toFixed(2),
                      })}
                    </span>
                    {" / "}
                    <span className="tabular-nums">
                      {t("orders.totalCost")}{" "}
                      {t("orders.money", {
                        amount: order.totalCost.toFixed(2),
                      })}
                    </span>
                  </p>
                  <p className={dueMoneyClass(order.remainingAmount)}>
                    {t("orders.remainingAmount")}{" "}
                    {t("orders.money", {
                      amount: order.remainingAmount.toFixed(2),
                    })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-start sm:flex sm:shrink-0 sm:flex-col sm:gap-2 sm:text-end">
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("orders.orderDate")}
                  </p>
                  <p className="text-base">{order.orderDate}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    {t("orders.expectedCompletionDate")}
                  </p>
                  <p className="text-base">{order.expectedCompletionDate}</p>
                </div>
                {order.isDelayed ? (
                  <p className="col-span-2 font-semibold text-destructive sm:col-span-1">
                    {t("orders.delayedBy", {
                      count: daysLate(order.expectedCompletionDate),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </CardRow>
          )}
        />
      </div>

      {page ? (
        <ListPagination
          meta={page}
          pageItemCount={rows.length}
          isLoading={isPending}
          mode="bar"
          className="shrink-0"
          onPageChange={(pageNumber) =>
            setParams({ ...params, page: pageNumber })
          }
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </section>
  );
}
