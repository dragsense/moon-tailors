import { useState } from "react";
import type { IOrder, IPaginatedResponse } from "@moon-tailors/contracts";
import { EOrderStatus } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert, CardRow, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import type { QueryOpComponentProps } from "~/ops";
import { orderPath } from "~/config/routes.config";
import type { TranslationKey } from "~/locales";

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
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState(
    typeof params.search === "string" ? params.search : "",
  );
  const page = data as IPaginatedResponse<IOrder> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("orders.loadFailed")
        : null;

  return (
    <Page title={t("orders.title")} description={t("orders.description")}>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setParams({
            ...params,
            page: 1,
            search,
          });
        }}
      >
        <Input
          className="h-11 text-base"
          placeholder={t("orders.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="border-input h-11 rounded-lg border bg-transparent px-3 text-base"
          value={typeof params.status === "string" ? params.status : ""}
          onChange={(event) =>
            setParams({
              ...params,
              page: 1,
              status: event.target.value || undefined,
            })
          }
        >
          <option value="">{t("orders.allStatuses")}</option>
          {Object.values(EOrderStatus).map((status) => (
            <option key={status} value={status}>
              {statusLabel(t, status)}
            </option>
          ))}
        </select>
        <Button type="submit" size="lg">
          {t("common.actions.search")}
        </Button>
      </form>

      {isPending ? (
        <p className="text-muted-foreground text-base">{t("common.actions.loading")}</p>
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
              <Button asChild size="lg" variant="outline">
                <Link to={orderPath(order.id)}>{t("orders.view")}</Link>
              </Button>
            }
          >
            <p className="text-muted-foreground text-base">
              {order.customer?.name ?? ""} · {statusLabel(t, order.status)}
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
          onPageChange={(pageNumber) => setParams({ ...params, page: pageNumber })}
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </Page>
  );
}
