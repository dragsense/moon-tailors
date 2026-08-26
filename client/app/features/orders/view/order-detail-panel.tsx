import { useEffect, useState } from "react";
import type { IOrder } from "@moon-tailors/contracts";
import {
  EOrderStatus,
  updateOrderSchema,
  type TUpdateOrderData,
} from "@moon-tailors/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { SchemaForm } from "~/components/form-ui";
import { MeasurementForm } from "~/features/measurements";
import { useI18n } from "~/hooks/use-i18n";
import { OpsComponent, useOp, type OpsStore } from "~/ops";
import type { TranslationKey } from "~/locales";

export function OrderDetailPanel({
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
  const update = useOp(store, "updateOrder");
  const updateMeasurement = useOp(store, "updateMeasurement");
  const getMeasurement = useOp(store, "getMeasurement");
  const applyMeasurementsToDefault = useOp(
    store,
    "applyMeasurementsToDefault",
  );

  useEffect(() => {
    if (getMeasurement.kind !== "query") return;
    const id = order?.measurementId ?? "";
    const garmentType = order?.garmentType ?? "";
    if (
      getMeasurement.params.id !== id ||
      getMeasurement.params.garmentType !== garmentType
    ) {
      getMeasurement.setParams({ id, garmentType });
    }
  }, [getMeasurement, order?.garmentType, order?.measurementId]);

  if (update.kind !== "mutation") return null;
  if (updateMeasurement.kind !== "mutation") return null;
  if (applyMeasurementsToDefault.kind !== "mutation") return null;

  function confirmForceEdit() {
    return window.confirm(t("orders.forceEditConfirm"));
  }

  return (
    <div className="flex flex-col gap-6">
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
            <Badge>
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

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <section className="rounded-xl border border-border/60 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="font-heading text-base font-semibold">
                  {t("orders.details")}
                </h2>
                {update.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (order.isLocked && !editing && !confirmForceEdit()) {
                        return;
                      }
                      setEditing((value) => !value);
                    }}
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
                  schema={updateOrderSchema.omit({ forceEdit: true })}
                  defaultValues={order}
                  fieldConfig={{
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
                    totalCost: { label: t("orders.totalCost") },
                    paidAmount: { label: t("orders.paidAmount") },
                    notes: { label: t("orders.notes") },
                  }}
                  submitLabel={t("common.actions.save")}
                  onSubmit={async (values) => {
                    await update.run({
                      id: order.id,
                      ...(values as TUpdateOrderData),
                      forceEdit: order.isLocked || undefined,
                    });
                    setEditing(false);
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
                      {order.totalCost.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.paidAmount")}
                    </dt>
                    <dd className="tabular-nums">
                      {order.paidAmount.toFixed(2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground text-xs">
                      {t("orders.remainingAmount")}
                    </dt>
                    <dd className="tabular-nums">
                      {order.remainingAmount.toFixed(2)}
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

            <section className="rounded-xl border border-border/60 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-base font-semibold">
                  {t("orders.orderMeasurements")}
                </h2>
                {updateMeasurement.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (
                        order.isLocked &&
                        !editingMeasures &&
                        !confirmForceEdit()
                      ) {
                        return;
                      }
                      setEditingMeasures((value) => !value);
                    }}
                  >
                    {editingMeasures
                      ? t("common.actions.cancel")
                      : t("common.actions.edit")}
                  </Button>
                ) : null}
              </div>
              {editingMeasures ? (
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
                    onSubmit={async (values) => {
                      await updateMeasurement.run({
                        measurementId: order.measurementId,
                        ...values,
                        forceEdit: order.isLocked || undefined,
                      });
                      setEditingMeasures(false);
                    }}
                  />
                </div>
              ) : (
                <OpsComponent store={store} name="getMeasurement" />
              )}
              {applyMeasurementsToDefault.allowed ? (
                <div className="mt-4 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (window.confirm(t("orders.updateDefaultsConfirm"))) {
                        void applyMeasurementsToDefault
                          .run({ id: order.id })
                          .catch(() => {});
                      }
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
