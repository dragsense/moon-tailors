import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type {
  ICustomer,
  IOrder,
  IPaginatedResponse,
} from "@moon-tailors/contracts";
import {
  updateCustomerSchema,
  type TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { Alert, CardRow, List } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerNewOrderPath, orderPath } from "~/config/routes.config";
import type { TranslationKey } from "~/locales";
import {
  MeasurementForm,
  MeasurementReadout,
} from "../components/measurement-fields";

export function CustomerDetail({
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
  const updateCustomer = useOp(store, "updateCustomer");
  const updateDefaultMeasurements = useOp(store, "updateDefaultMeasurements");
  const listCustomerOrders = useOp(store, "listCustomerOrders");

  useEffect(() => {
    if (id && params.id !== id) setParams({ id });
  }, [id, params.id, setParams]);

  useEffect(() => {
    if (
      listCustomerOrders.kind === "query" &&
      id &&
      listCustomerOrders.params.customerId !== id
    ) {
      listCustomerOrders.setParams({ customerId: id, page: 1, limit: 20 });
    }
  }, [id, listCustomerOrders]);

  if (updateCustomer.kind !== "mutation") return null;
  if (updateDefaultMeasurements.kind !== "mutation") return null;

  const customer = data as ICustomer | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("customers.loadFailed")
        : null;
  const ordersPage =
    listCustomerOrders.kind === "query"
      ? (listCustomerOrders.data as IPaginatedResponse<IOrder> | undefined)
      : undefined;
  const orders = ordersPage?.data ?? [];

  return (
    <Page
      title={customer?.name ?? t("customers.title")}
      description={t("customers.profile")}
      actions={
        customer ? (
          <Button asChild size="lg">
            <Link to={customerNewOrderPath(customer.id)}>
              {t("customers.startOrder")}
            </Link>
          </Button>
        ) : null
      }
    >
      {isPending && !customer ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("customers.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {customer ? (
        <div className="flex flex-col gap-8">
          <section className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">
                {t("customers.details")}
              </h2>
              {updateCustomer.allowed ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing((value) => !value)}
                >
                  {editing
                    ? t("common.actions.cancel")
                    : t("common.actions.edit")}
                </Button>
              ) : null}
            </div>
            {editing ? (
              <SchemaForm
                schema={updateCustomerSchema}
                defaultValues={customer}
                submitLabel={t("common.actions.save")}
                onSubmit={async (values) => {
                  await updateCustomer.run({
                    id: customer.id,
                    ...(values as TUpdateCustomerData),
                  });
                  setEditing(false);
                }}
              />
            ) : (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.phone")}
                  </dt>
                  <dd>{customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.whatsapp")}
                  </dt>
                  <dd>{customer.whatsapp || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.email")}
                  </dt>
                  <dd>{customer.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.address")}
                  </dt>
                  <dd>{customer.address || "—"}</dd>
                </div>
                {customer.notes ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground text-xs">
                      {t("customers.notes")}
                    </dt>
                    <dd>{customer.notes}</dd>
                  </div>
                ) : null}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-border/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-heading text-base font-semibold">
                {t("customers.defaultMeasurements")}
              </h2>
              {updateDefaultMeasurements.allowed ? (
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
            {editingMeasures ? (
              <MeasurementForm
                measurement={customer.defaultMeasurement}
                submitLabel={t("common.actions.save")}
                onSubmit={async (values) => {
                  await updateDefaultMeasurements.run({
                    id: customer.id,
                    ...values,
                  });
                  setEditingMeasures(false);
                }}
              />
            ) : (
              <MeasurementReadout measurement={customer.defaultMeasurement} />
            )}
          </section>

          <section>
            <h2 className="font-heading mb-3 text-base font-semibold">
              {t("customers.orderHistory")}
            </h2>
            <List
              items={orders}
              getItemKey={(row: IOrder) => row.id}
              empty={
                <p className="text-muted-foreground text-sm">
                  {t("orders.empty")}
                </p>
              }
              renderItem={(order: IOrder) => (
                <CardRow
                  title={order.orderNumber}
                  actions={
                    <Button asChild size="sm" variant="outline">
                      <Link to={orderPath(order.id)}>
                        {t("common.actions.open")}
                      </Link>
                    </Button>
                  }
                >
                  <p className="text-muted-foreground text-sm">
                    {t(`orders.status.${order.status}` as TranslationKey)}
                    {order.isDelayed ? ` · ${t("orders.delayed")}` : ""}
                    {order.isLocked ? ` · ${t("orders.locked")}` : ""}
                  </p>
                </CardRow>
              )}
            />
          </section>
        </div>
      ) : null}
    </Page>
  );
}
