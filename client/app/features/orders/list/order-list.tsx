import type { IOrder, IPaginatedResponse } from "@moon-tailors/contracts";
import { EOrderStatus } from "@moon-tailors/contracts";
import { Alert, CardRow, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import type { TranslationKey } from "~/locales";
import { OrderFilters } from "./order-filters";

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
  const page = data as IPaginatedResponse<IOrder> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("orders.loadFailed")
        : null;

  return (
    <section className="flex flex-col gap-6">
      <OrderFilters
        values={params}
        onChange={(filters) =>
          setParams({
            page: 1,
            limit: params.limit ?? 20,
            customerId: params.customerId,
            ...filters,
          })
        }
      />

      {isPending ? (
        <p className="text-muted-foreground text-base">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("orders.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

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
            title={order.orderNumber}
            actions={
              view.kind === "mutation" && view.allowed ? (
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  onClick={() => view.open(order)}
                >
                  {t("orders.view")}
                </Button>
              ) : null
            }
          >
            <p className="text-muted-foreground text-base">
              {order.customer?.name ?? ""}
              {order.garmentType ? ` · ${order.garmentType}` : ""}
              {" · "}
              {statusLabel(t, order.status)}
              {order.isDelayed ? ` · ${t("orders.delayed")}` : ""}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              {order.orderDate} → {order.expectedCompletionDate} ·{" "}
              {t("orders.paidAmount")} {order.paidAmount.toFixed(2)} /{" "}
              {t("orders.totalCost")} {order.totalCost.toFixed(2)}
            </p>
          </CardRow>
        )}
      />

      {page ? (
        <ListPagination
          meta={page}
          pageItemCount={rows.length}
          isLoading={isPending}
          mode="bar"
          onPageChange={(pageNumber) =>
            setParams({ ...params, page: pageNumber })
          }
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </section>
  );
}
