import { useState } from "react";
import type { ICustomer, TMeasurementValues } from "@moon-tailors/contracts";
import {
  EGender,
  updateCustomerSchema,
  type TUpdateCustomerData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import {
  MeasurementDisplay,
  MeasurementForm,
} from "~/features/measurements";
import { CustomerAvatar } from "../components/customer-avatar";
import { useOp, type QueryOpComponentProps } from "~/ops";

export function CustomerDetail({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [editingMeasures, setEditingMeasures] = useState(false);
  const updateCustomer = useOp(store, "updateCustomer");
  const updateMeasurement = useOp(store, "updateMeasurement");
  const addMeasurement = useOp(store, "addMeasurement");

  if (updateCustomer.kind !== "mutation") return null;
  if (updateMeasurement.kind !== "mutation") return null;
  if (addMeasurement.kind !== "mutation") return null;

  const customer = data as ICustomer | undefined;
  const canEditMeasures = customer?.measurement?.id
    ? updateMeasurement.allowed
    : addMeasurement.allowed;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("customers.loadFailed")
        : null;

  return (
    <div className="flex min-w-0 flex-col gap-6 overflow-x-hidden">
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
          <div className="grid min-w-0 gap-2 lg:grid-cols-2 lg:items-start">
            <section className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <CustomerAvatar
                    customer={customer}
                    size="sm"
                    className="size-10 shrink-0 text-sm"
                  />
                  <h2 className="font-heading break-words text-base font-semibold">
                    {customer.name}
                  </h2>
                </div>
                {updateCustomer.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
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

            <section className="rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-heading text-base font-semibold">
                  {t("customers.defaultMeasurements")}
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
                <MeasurementForm
                  key={customer.measurement?.id ?? `new-${customer.id}`}
                  measurement={customer.measurement}
                  submitLabel={t("common.actions.save")}
                  onSubmit={async (values: TMeasurementValues) => {
                    if (customer.measurement?.id) {
                      await updateMeasurement.run({
                        id: customer.measurement.id,
                        ...values,
                      });
                    } else {
                      await addMeasurement.run({
                        customerId: customer.id,
                        ...values,
                      });
                    }
                    setEditingMeasures(false);
                  }}
                />
              ) : (
                <MeasurementDisplay measurement={customer.measurement} />
              )}
            </section>
          </div>
      ) : null}
    </div>
  );
}
