import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type {
  ICustomer,
  IGarmentType,
  IOrder,
  IPaginatedResponse,
  TMeasurementValues,
} from "@moon-tailors/contracts";
import {
  EGarmentAudience,
  EGender,
  garmentAudienceForGender,
  hasMeasurementValues,
  pickMeasurementValues,
  updateCustomerSchema,
  type TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert, CardRow, List } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import {
  APP_ROUTES,
  customerNewOrderPath,
  orderPath,
} from "~/config/routes.config";
import type { TranslationKey } from "~/locales";
import { useGarmentTypes } from "~/features/garment-types/use-garment-types";
import { GarmentTypeField } from "~/features/garment-types/components/garment-type-field";
import { CustomerAvatar } from "../components/customer-avatar";
import {
  CopyFromRow,
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
  const [orderSearch, setOrderSearch] = useState("");
  const updateCustomer = useOp(store, "updateCustomer");
  const updateDefaultMeasurements = useOp(store, "updateDefaultMeasurements");
  const copyMeasurement = useOp(store, "copyMeasurement");
  const listCustomerOrders = useOp(store, "listCustomerOrders");
  const { types: allTypes, isPending: typesPending } = useGarmentTypes();

  useEffect(() => {
    if (id && params.id !== id) setParams({ id });
  }, [id, params.id, setParams]);

  useEffect(() => {
    if (
      listCustomerOrders.kind === "query" &&
      id &&
      listCustomerOrders.params.customerId !== id
    ) {
      listCustomerOrders.setParams({
        customerId: id,
        page: 1,
        limit: 20,
        search: "",
      });
    }
  }, [id, listCustomerOrders]);

  if (updateCustomer.kind !== "mutation") return null;
  if (updateDefaultMeasurements.kind !== "mutation") return null;
  if (copyMeasurement.kind !== "mutation") return null;

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
  const types = allTypes.filter((type) => {
    const audience = garmentAudienceForGender(customer?.gender);
    return audience ? type.audience === audience : true;
  });
  const savedByType = new Map(
    (customer?.measurements ?? []).map((row) => [row.garmentTypeId, row]),
  );
  const filledTypes = types.filter((type) =>
    hasMeasurementValues(savedByType.get(type.id)),
  );

  return (
    <Page
      title={customer?.name ?? t("customers.title")}
      description={t("customers.profile")}
      actions={
        <>
          <Button asChild size="lg" variant="outline">
            <Link to={APP_ROUTES.DASHBOARD}>{t("nav.items.dashboard")}</Link>
          </Button>
          {customer ? (
            <Button asChild size="lg">
              <Link to={customerNewOrderPath(customer.id)}>
                {t("customers.startOrder")}
              </Link>
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
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            <section className="rounded-xl border border-border/60 p-4">
            <div className="mb-4">
              <CustomerAvatar customer={customer} className="size-24 text-lg" />
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
                fieldConfig={{ email: { hidden: true } }}
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
                    {t("customers.whatsapp")}
                  </dt>
                  <dd>{customer.whatsapp || "—"}</dd>
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

          <CustomerMeasurementsColumn
            types={types}
            typesPending={typesPending}
            audience={
              garmentAudienceForGender(customer.gender) ??
              EGarmentAudience.GENTS
            }
            savedByType={savedByType}
            filledTypes={filledTypes}
            canEdit={updateDefaultMeasurements.allowed}
            canCopy={copyMeasurement.allowed}
            onSave={async (garmentTypeId, values) => {
              await updateDefaultMeasurements.run({
                id: customer.id,
                garmentTypeId,
                ...values,
              });
            }}
            onCopy={async (toId, fromId) => {
              await copyMeasurement.run({
                id: customer.id,
                fromGarmentTypeId: fromId,
                toGarmentTypeId: toId,
              });
            }}
          />
          </div>

          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-heading text-base font-semibold">
                {t("customers.orderHistory")}
              </h2>
              <Button asChild size="lg">
                <Link to={customerNewOrderPath(customer.id)}>
                  {t("customers.startOrder")}
                </Link>
              </Button>
            </div>
            {listCustomerOrders.kind === "query" ? (
              <form
                className="mb-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  listCustomerOrders.setParams({
                    ...listCustomerOrders.params,
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

function CustomerMeasurementsColumn({
  types,
  typesPending,
  audience,
  savedByType,
  filledTypes,
  canEdit,
  canCopy,
  onSave,
  onCopy,
}: {
  types: IGarmentType[];
  typesPending: boolean;
  audience: EGarmentAudience;
  savedByType: Map<string, ICustomer["measurements"][number]>;
  filledTypes: IGarmentType[];
  canEdit: boolean;
  canCopy: boolean;
  onSave: (garmentTypeId: string, values: TMeasurementValues) => Promise<void>;
  onCopy: (toId: string, fromId: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState("");
  const selected =
    types.find((type) => type.id === selectedId) ?? types[0] ?? null;
  const measurement = selected ? savedByType.get(selected.id) : undefined;
  const filledIds = new Set(filledTypes.map((type) => type.id));
  const typeKey = types.map((type) => type.id).join(",");

  useEffect(() => {
    const ids = typeKey ? typeKey.split(",") : [];
    setSelectedId((current) => {
      if (ids.length === 0) return "";
      return ids.includes(current) ? current : ids[0];
    });
  }, [typeKey]);

  return (
    <section className="rounded-xl border border-border/60 p-4">
      <div className="mb-3 space-y-1">
        <h2 className="font-heading text-base font-semibold">
          {t("customers.defaultMeasurements")}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t("customers.measurementsHint")}
        </p>
      </div>
      {typesPending ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : (
        <div className="space-y-4">
          <GarmentTypeField
            types={types}
            value={selected?.id ?? ""}
            audience={audience}
            filledIds={filledIds}
            onChange={setSelectedId}
          />
          {selected && canCopy ? (
            <CopyFromRow
              types={filledTypes.filter((item) => item.id !== selected.id)}
              onCopy={(fromId) => {
                void onCopy(selected.id, fromId);
              }}
            />
          ) : null}
          {selected && canEdit ? (
            <MeasurementForm
              key={measurement?.updatedAt ?? `${selected.id}-empty`}
              measurement={measurement ?? pickMeasurementValues()}
              submitLabel={t("common.actions.save")}
              onSubmit={(values) => onSave(selected.id, values)}
            />
          ) : selected ? (
            <MeasurementReadout measurement={measurement ?? null} />
          ) : null}
        </div>
      )}
    </section>
  );
}
