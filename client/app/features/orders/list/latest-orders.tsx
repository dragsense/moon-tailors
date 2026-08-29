import type { IOrder, IPaginatedResponse } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { dashboardOrdersPath } from "~/config/routes.config";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";
import type { QueryOpComponentProps } from "~/ops";
import {
  orderStatusBadgeClass,
  orderStatusCardClass,
} from "../status-style";

/** Compact latest-jobs list for the dashboard glance column. */
export function LatestOrders({
  data,
  isPending,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const page = data as IPaginatedResponse<IOrder> | undefined;
  const rows = page?.data ?? [];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-3">
      <h2 className="font-heading text-sm font-semibold">
        {t("dashboard.latestOrders")}
      </h2>

      {isPending && !page ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}

      {!isPending && rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {t("dashboard.latestEmpty")}
        </p>
      ) : null}

      <ul className="flex flex-col gap-2">
        {rows.map((order) => (
          <li
            key={order.id}
            className={`rounded-lg px-3 py-2 ${orderStatusCardClass(order.status, order.isDelayed)}`}
          >
            <p className="truncate text-sm font-semibold">
              {t("orders.numberLabel")}{" "}
              <span className="font-bold">{order.orderNumber}</span>
            </p>
            {order.customer?.name || order.garmentType ? (
              <p className="text-muted-foreground truncate text-xs">
                {[order.customer?.name, order.garmentType]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge
                className={`h-6 px-2 text-xs ${orderStatusBadgeClass(order.status)}`}
              >
                {t(`orders.status.${order.status}` as TranslationKey)}
              </Badge>
              {order.isDelayed ? (
                <Badge variant="destructive" className="h-6 px-2 text-xs">
                  {t("orders.delayed")}
                </Badge>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <Button asChild size="sm" variant="outline" className="w-full">
        <Link to={dashboardOrdersPath()}>{t("dashboard.viewOrders")}</Link>
      </Button>
    </div>
  );
}
