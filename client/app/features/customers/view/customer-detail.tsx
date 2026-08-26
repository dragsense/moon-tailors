import { useEffect, useState } from "react";
import { useParams } from "react-router";
import type {
  ICustomer,
  IOrder,
  IPaginatedResponse,
  TMeasurementValues,
} from "@moon-tailors/contracts";
import {
  EGender,
  EOrderStatus,
  pickMeasurementValues,
  updateCustomerSchema,
  type TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert, CardRow, List, Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { customerPath } from "~/config/routes.config";
import type { TranslationKey } from "~/locales";
import {
  ORDER_WORKSPACE_MODAL_BODY_CLASS,
  ORDER_WORKSPACE_MODAL_CLASS,
} from "~/features/orders/order-modal";
import { MeasurementForm } from "~/features/measurements";
import { CustomerAvatar } from "../components/customer-avatar";
import { OpsComponent, useOp, type QueryOpComponentProps } from "~/ops";

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
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const updateCustomer = useOp(store, "updateCustomer");
  const updateDefaultMeasurements = useOp(store, "updateDefaultMeasurements");
  const getMeasurement = useOp(store, "getMeasurement");
  const listOrders = useOp(store, "listOrders");
  const createOrder = useOp(store, "createOrder");
  const updateOrder = useOp(store, "updateOrder");
  const viewOrder = useOp(store, "viewOrder");
  const [statusBusyId, setStatusBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (id && params.id !== id) setParams({ id });
  }, [id, params.id, setParams]);

  useEffect(() => {
    if (getMeasurement.kind !== "query") return;
    const measurementId = (data as ICustomer | undefined)?.measurement?.id ?? "";
    if (getMeasurement.params.id !== measurementId) {
      getMeasurement.setParams({ id: measurementId });
    }
  }, [data, getMeasurement]);

  useEffect(() => {
    if (
      ordersOpen &&
      listOrders.kind === "query" &&
      id &&
      listOrders.params.customerId !== id
    ) {
      listOrders.setParams({
        customerId: id,
        page: 1,
        limit: 20,
        search: "",
      });
    }
  }, [ordersOpen, id, listOrders]);

  if (updateCustomer.kind !== "mutation") return null;
  if (updateDefaultMeasurements.kind !== "mutation") return null;
  if (createOrder.kind !== "mutation") return null;
  if (updateOrder.kind !== "mutation") return null;

  const customer = data as ICustomer | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("customers.loadFailed")
        : null;
  const ordersPage =
    listOrders.kind === "query"
      ? (listOrders.data as IPaginatedResponse<IOrder> | undefined)
      : undefined;
  const orders = ordersPage?.data ?? [];

  function openOrders() {
    setOrderSearch("");
    if (listOrders.kind === "query" && customer) {
      listOrders.setParams({
        customerId: customer.id,
        page: 1,
        limit: 20,
        search: "",
      });
    }
    setOrdersOpen(true);
  }

  async function changeOrderStatus(order: IOrder, status: EOrderStatus) {
    if (status === order.status) return;
    if (order.isLocked && !window.confirm(t("orders.forceEditConfirm"))) {
      return;
    }
    if (updateOrder.kind !== "mutation") return;
    const runUpdate = updateOrder.run;
    setStatusBusyId(order.id);
    try {
      await runUpdate({
        id: order.id,
        status,
        forceEdit: order.isLocked || undefined,
      });
      if (listOrders.kind === "query") {
        await listOrders.refetch();
      }
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <Page
      title={customer?.name ?? t("customers.title")}
      description={t("customers.profile")}
      breadcrumbItems={
        customer
          ? [
              {
                label: customer.name,
                href: customerPath(customer.id),
              },
            ]
          : undefined
      }
      actions={
        <>
          {customer ? (
            <Button type="button" size="lg" variant="outline" onClick={openOrders}>
              {t("customers.viewOrders")}
            </Button>
          ) : null}
          {customer && createOrder.allowed ? (
            <Button
              type="button"
              size="lg"
              onClick={() => createOrder.open(customer)}
            >
              {t("customers.startOrder")}
            </Button>
          ) : null}
        </>
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
        <div className="grid gap-6 lg:grid-cols-[minmax(20rem,32rem)_minmax(0,1fr)] lg:items-start">
          <section className="rounded-xl border border-border/60 p-4">
            <div className="mb-4">
              <CustomerAvatar customer={customer} className="size-16 text-base" />
            </div>
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
                fieldConfig={{
                  email: { hidden: true },
                  phone: {
                    label: t("customers.phone"),
                    placeholder: t("customers.phonePlaceholder"),
                  },
                  alternative: { label: t("customers.alternative") },
                  name: {
                    label: t("customers.name"),
                    placeholder: t("customers.namePlaceholder"),
                  },
                  gender: {
                    label: t("customers.gender"),
                    options: [
                      { label: t("customers.male"), value: EGender.MALE },
                      { label: t("customers.female"), value: EGender.FEMALE },
                    ],
                  },
                  address: { label: t("customers.address") },
                  notes: { label: t("customers.notes") },
                }}
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
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.gender")}
                  </dt>
                  <dd>
                    {customer.gender === EGender.FEMALE
                      ? t("customers.female")
                      : t("customers.male")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.phone")}
                  </dt>
                  <dd>{customer.phone}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.alternative")}
                  </dt>
                  <dd>{customer.alternative || "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t("customers.address")}
                  </dt>
                  <dd>{customer.address || "—"}</dd>
                </div>
                {customer.notes ? (
                  <div>
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
            <div className="mb-3 space-y-1">
              <h2 className="font-heading text-base font-semibold">
                {t("customers.defaultMeasurements")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {t("customers.measurementsHint")}
              </p>
            </div>
            {updateDefaultMeasurements.allowed ? (
              <MeasurementForm
                key={customer.measurement?.updatedAt ?? "empty-default"}
                measurement={customer.measurement ?? pickMeasurementValues()}
                submitLabel={t("common.actions.save")}
                onSubmit={async (values: TMeasurementValues) => {
                  await updateDefaultMeasurements.run({
                    id: customer.id,
                    measurementId: customer.measurement?.id,
                    ...values,
                  });
                }}
              />
            ) : (
              <OpsComponent store={store} name="getMeasurement" />
            )}
          </section>
        </div>
      ) : null}

      {ordersOpen && customer ? (
        <Modal
          title={t("customers.orderHistory")}
          description={customer.name}
          onClose={() => setOrdersOpen(false)}
          className={ORDER_WORKSPACE_MODAL_CLASS}
          contentClassName={ORDER_WORKSPACE_MODAL_BODY_CLASS}
        >
          {listOrders.kind === "query" ? (
            <form
              className="mb-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                listOrders.setParams({
                  ...listOrders.params,
                  customerId: customer.id,
                  page: 1,
                  search: orderSearch,
                });
              }}
            >
              <Input
                className="h-11 text-base"
                placeholder={t("orders.searchPlaceholder")}
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
              />
              <Button type="submit" size="lg">
                {t("common.actions.search")}
              </Button>
            </form>
          ) : null}
          {listOrders.kind === "query" &&
          listOrders.isPending &&
          orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("common.actions.loading")}
            </p>
          ) : (
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
                    <div className="flex flex-wrap items-center gap-2">
                      {updateOrder.allowed ? (
                        <Select
                          value={order.status}
                          disabled={statusBusyId === order.id}
                          onValueChange={(value) => {
                            void changeOrderStatus(
                              order,
                              value as EOrderStatus,
                            );
                          }}
                        >
                          <SelectTrigger
                            className="h-9 max-w-[11rem]"
                            aria-label={t("orders.updateStatus")}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.values(EOrderStatus).map((status) => (
                              <SelectItem key={status} value={status}>
                                {t(
                                  `orders.status.${status}` as TranslationKey,
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : null}
                      {viewOrder.kind === "mutation" && viewOrder.allowed ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => viewOrder.open(order)}
                        >
                          {t("orders.view")}
                        </Button>
                      ) : null}
                    </div>
                  }
                >
                  <p className="text-muted-foreground text-sm">
                    {order.garmentType ? `${order.garmentType} · ` : ""}
                    {order.isDelayed ? `${t("orders.delayed")} · ` : ""}
                    {order.isLocked ? t("orders.locked") : ""}
                  </p>
                </CardRow>
              )}
            />
          )}
        </Modal>
      ) : null}
    </Page>
  );
}
