import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { IOrder } from "@moon-tailors/contracts";
import {
  updateOrderSchema,
  type TUpdateOrderData,
} from "@moon-tailors/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath } from "~/config/routes.config";
import type { TranslationKey } from "~/locales";
import {
  MeasurementForm,
  MeasurementReadout,
} from "~/features/customers/components/measurement-fields";

export function OrderDetail({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const [editing, setEditing] = useState(false);
  const [editingMeasures, setEditingMeasures] = useState(false);
  const updateOrder = useOp(store, "updateOrder");
  const updateOrderMeasurements = useOp(store, "updateOrderMeasurements");
  const applyMeasurementsToDefault = useOp(
    store,
    "applyMeasurementsToDefault",
  );

  useEffect(() => {
    if (id && params.id !== id) setParams({ id });
  }, [id, params.id, setParams]);

  if (updateOrder.kind !== "mutation") return null;
  if (updateOrderMeasurements.kind !== "mutation") return null;
  if (applyMeasurementsToDefault.kind !== "mutation") return null;

  const order = data as IOrder | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("orders.loadFailed")
        : null;

  function confirmForceEdit() {
    return window.confirm(t("orders.forceEditConfirm"));
  }

  return (
    <Page
      title={order?.orderNumber ?? t("orders.title")}
      description={t("orders.detail")}
    >
      {isPending && !order ? (
        <p className="text-muted-foreground text-sm">{t("common.actions.loading")}</p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("orders.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {order ? (
        <div className="flex flex-col gap-8">
          <div className="flex flex-wrap gap-2">
            <Badge>{t(`orders.status.${order.status}` as TranslationKey)}</Badge>
            {order.isDelayed ? (
              <Badge variant="destructive">{t("orders.delayed")}</Badge>
            ) : null}
            {order.isLocked ? (
              <Badge variant="outline">{t("orders.locked")}</Badge>
            ) : null}
          </div>

          <p className="text-sm">
            <Link className="underline" to={customerPath(order.customerId)}>
              {order.customer?.name ?? order.customerId}
            </Link>
          </p>

          <section className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">
                {t("orders.details")}
              </h2>
              {updateOrder.allowed ? (
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
                submitLabel={t("common.actions.save")}
                onSubmit={async (values) => {
                  await updateOrder.run({
                    id: order.id,
                    ...(values as TUpdateOrderData),
                    forceEdit: order.isLocked || undefined,
                  });
                  setEditing(false);
                }}
              />
            ) : (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
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
                  <dd className="tabular-nums">{order.totalCost.toFixed(2)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("orders.paidAmount")}
                  </dt>
                  <dd className="tabular-nums">{order.paidAmount.toFixed(2)}</dd>
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
                  <div className="sm:col-span-2">
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
              <div className="flex gap-2">
                {applyMeasurementsToDefault.allowed ? (
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
                ) : null}
                {updateOrderMeasurements.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (order.isLocked && !editingMeasures && !confirmForceEdit()) {
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
            </div>
            {editingMeasures ? (
              <MeasurementForm
                measurement={order.measurement}
                submitLabel={t("common.actions.save")}
                onSubmit={async (values) => {
                  await updateOrderMeasurements.run({
                    id: order.id,
                    ...values,
                    forceEdit: order.isLocked || undefined,
                  });
                  setEditingMeasures(false);
                }}
              />
            ) : (
              <MeasurementReadout measurement={order.measurement} />
            )}
          </section>
        </div>
      ) : null}
    </Page>
  );
}
