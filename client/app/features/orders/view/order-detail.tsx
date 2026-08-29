import { useState } from "react";
import type { IOrder, TMeasurementValues } from "@moon-tailors/contracts";
import {
  EOrderStatus,
  updateOrderSchema,
  type TUpdateOrderData,
} from "@moon-tailors/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { SchemaForm } from "~/components/form-ui";
import {
  MeasurementDisplay,
  MeasurementForm,
} from "~/features/measurements";
import { useI18n } from "~/hooks/use-i18n";
import { useMaybeOp, type OpsStore } from "~/ops";
import type { TranslationKey } from "~/locales";
import {
  dueMoneyClass,
  orderStatusBadgeClass,
  paidMoneyClass,
} from "../status-style";

export function OrderDetail({
  store,
  order,
  isPending,
  errorMessage,
}: {
  store: OpsStore;
  order?: IOrder | null;
  isPending?: boolean;
  errorMessage?: string | null;
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editingMeasures, setEditingMeasures] = useState(false);
  const update = useMaybeOp(store, "updateOrder");
  const updateMeasurement = useMaybeOp(store, "updateMeasurement");
  const applyMeasurementsToDefault = useMaybeOp(
    store,
    "applyMeasurementsToDefault",
  );

  const canUpdate = update?.kind === "mutation" && update.allowed;
  const canEditMeasures = Boolean(
    updateMeasurement?.kind === "mutation" &&
      updateMeasurement.allowed &&
      order?.measurementId,
  );
  const canApplyDefaults = Boolean(
    applyMeasurementsToDefault?.kind === "mutation" &&
      applyMeasurementsToDefault.allowed,
  );

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
      {isPending && !order ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("orders.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {order ? (
        <>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={`h-7 px-3 text-sm ${orderStatusBadgeClass(order.status)}`}
            >
              {t(`orders.status.${order.status}` as TranslationKey)}
            </Badge>
            {order.isDelayed ? (
              <Badge variant="destructive">{t("orders.delayed")}</Badge>
            ) : null}
            {order.isLocked ? (
              <Badge variant="outline">{t("orders.locked")}</Badge>
            ) : null}
            {order.customer?.name ? (
              <Badge variant="outline">{order.customer.name}</Badge>
            ) : null}
          </div>

          <div className="grid gap-2 lg:grid-cols-2 lg:items-start">
            <section className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-heading text-base font-semibold">
                  {t("orders.details")}
                </h2>
                {canUpdate ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing
                      ? t("common.actions.cancel")
                      : order.isLocked
                        ? t("orders.forceEdit")
                        : t("common.actions.edit")}
                  </Button>
                ) : null}
              </div>
              {editing ? (
                <SchemaForm
                  schema={updateOrderSchema}
                  defaultValues={order}
                  fieldConfig={{
                    forceEdit: { hidden: true },
                    garmentType: {
                      label: t("orders.garmentType"),
                      placeholder: t("orders.garmentTypePlaceholder"),
                    },
                    orderDate: { label: t("orders.orderDate") },
                    expectedCompletionDate: {
                      label: t("orders.expectedCompletionDate"),
                    },
                    status: {
                      label: t("orders.updateStatus"),
                      options: Object.values(EOrderStatus).map((status) => ({
                        label: t(`orders.status.${status}` as TranslationKey),
                        value: status,
                      })),
                    },
                    totalCost: { label: `${t("orders.totalCost")} (PKR)` },
                    paidAmount: { label: `${t("orders.paidAmount")} (PKR)` },
                    notes: { label: t("orders.notes") },
                  }}
                  submitLabel={t("common.actions.save")}
                  onSubmit={async (values) => {
                    if (update?.kind !== "mutation") return;
                    try {
                      await update.run({
                        id: order.id,
                        ...(values as TUpdateOrderData),
                        forceEdit: order.isLocked || undefined,
                      });
                      setEditing(false);
                    } catch {
                      /* confirm cancelled */
                    }
                  }}
                />
              ) : (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.orderDate")}
                    </dt>
                    <dd>{order.orderDate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.expectedCompletionDate")}
                    </dt>
                    <dd>{order.expectedCompletionDate}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.totalCost")}
                    </dt>
                    <dd className="tabular-nums">
                      {t("orders.money", { amount: order.totalCost.toFixed(2) })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.paidAmount")}
                    </dt>
                    <dd className={paidMoneyClass}>
                      {t("orders.money", { amount: order.paidAmount.toFixed(2) })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.remainingAmount")}
                    </dt>
                    <dd className={dueMoneyClass(order.remainingAmount)}>
                      {t("orders.money", {
                        amount: order.remainingAmount.toFixed(2),
                      })}
                    </dd>
                  </div>
                  {order.notes ? (
                    <div>
                      <dt className="text-muted-foreground text-xs">
                        {t("orders.notes")}
                      </dt>
                      <dd>{order.notes}</dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </section>

            <section className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-base font-semibold">
                  {t("orders.orderMeasurements")}
                </h2>
                {canEditMeasures ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingMeasures((value) => !value)}
                  >
                    {editingMeasures
                      ? t("common.actions.cancel")
                      : t("common.actions.edit")}
                  </Button>
                ) : null}
              </div>
              {editingMeasures && canEditMeasures ? (
                <div className="space-y-4">
                  {order.garmentType ? (
                    <div>
                      <p className="text-muted-foreground text-xs">
                        {t("measurements.garment")}
                      </p>
                      <p className="font-heading text-lg font-semibold">
                        {order.garmentType}
                      </p>
                    </div>
                  ) : null}
                  <MeasurementForm
                    measurement={order.measurement}
                    submitLabel={t("common.actions.save")}
                    onSubmit={async (values: TMeasurementValues) => {
                      if (updateMeasurement?.kind !== "mutation") return;
                      try {
                        await updateMeasurement.run({
                          id: order.measurementId,
                          ...values,
                          forceEdit: order.isLocked || undefined,
                        });
                        setEditingMeasures(false);
                      } catch {
                        /* confirm cancelled */
                      }
                    }}
                  />
                </div>
              ) : (
                <MeasurementDisplay
                  measurement={order.measurement}
                  garmentType={order.garmentType}
                />
              )}
              {canApplyDefaults && applyMeasurementsToDefault?.kind === "mutation" ? (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={applyMeasurementsToDefault.isPending}
                    onClick={() => {
                      void applyMeasurementsToDefault
                        .run({ id: order.id })
                        .catch(() => {});
                    }}
                  >
                    {t("orders.updateDefaults")}
                  </Button>
                </div>
              ) : null}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
