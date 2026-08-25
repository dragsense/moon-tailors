import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  createOrderSchema,
  EGarmentAudience,
  EOrderStatus,
  garmentAudienceForGender,
  pickMeasurementValues,
  type ICustomer,
  type TCreateOrderData,
} from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath, orderPath } from "~/config/routes.config";
import { useGarmentTypes } from "~/features/garment-types/use-garment-types";
import { GarmentTypeField } from "~/features/garment-types/components/garment-type-field";
import {
  GarmentTypeSelect,
  MeasurementFields,
} from "~/features/customers/components/measurement-fields";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function CreateOrderView({
  store,
  data,
  params,
  setParams,
  isPending,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createOrder = useOp(store, "createOrder");
  const customer = data as ICustomer | null | undefined;
  const { types } = useGarmentTypes(
    garmentAudienceForGender(customer?.gender),
  );

  useEffect(() => {
    if (customerId && params.id !== customerId) {
      setParams({ id: customerId });
    }
  }, [customerId, params.id, setParams]);

  if (createOrder.kind !== "mutation") return null;

  const saved = customer?.measurements ?? [];
  const initialTypeId = saved[0]?.garmentTypeId ?? types[0]?.id ?? "";

  return (
    <Page title={t("orders.new")} description={t("orders.newHint")}>
      {isPending && !customer ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : (
        <SchemaForm
          key={`${customer?.id ?? customerId ?? "new-order"}-${initialTypeId}`}
          schema={createOrderSchema}
          fieldConfig={{
            measurement: { hidden: true },
            garmentTypeId: { hidden: true },
            replaceDefault: { label: t("orders.replaceDefault") },
            replaceDefaultGarmentTypeId: { hidden: true },
          }}
          defaultValues={{
            customerId: customerId ?? "",
            orderDate: todayIso(),
            expectedCompletionDate: plusDaysIso(7),
            status: EOrderStatus.NEW,
            totalCost: 0,
            paidAmount: 0,
            garmentTypeId: initialTypeId,
            measurement: pickMeasurementValues(
              saved.find((row) => row.garmentTypeId === initialTypeId),
            ),
            replaceDefault: false,
            replaceDefaultGarmentTypeId: initialTypeId,
          }}
          onSubmit={async (values) => {
            const created = await createOrder.run({
              ...(values as TCreateOrderData),
              customerId: customerId ?? (values as TCreateOrderData).customerId,
            });
            const id = (created as { id?: string } | undefined)?.id;
            navigate(id ? orderPath(id) : customerPath(customerId ?? ""));
          }}
        >
          {({ fields, form, isSubmitting }) => {
            const garmentTypeId = form.watch("garmentTypeId") as string;
            const replaceDefault = form.watch("replaceDefault") as boolean;

            return (
              <div className="space-y-6">
                {customer ? (
                  <p className="text-muted-foreground text-sm">
                    {customer.name}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </p>
                ) : null}
                <div className="space-y-4">
                  {fields.customerId}
                  {fields.orderDate}
                  {fields.expectedCompletionDate}
                  {fields.status}
                  {fields.totalCost}
                  {fields.paidAmount}
                  {fields.notes}
                </div>
                <section className="space-y-3 rounded-xl border border-border/60 p-4">
                  <div>
                    <h3 className="font-heading text-sm font-semibold">
                      {t("orders.orderMeasurements")}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t("orders.measurementsHint")}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <Label>{t("orders.garmentType")}</Label>
                    <GarmentTypeField
                      types={types}
                      value={garmentTypeId}
                      audience={
                        garmentAudienceForGender(customer?.gender) ??
                        EGarmentAudience.GENTS
                      }
                      onChange={(nextId) => {
                        form.setValue("garmentTypeId", nextId);
                        const match = saved.find(
                          (row) => row.garmentTypeId === nextId,
                        );
                        form.setValue(
                          "measurement",
                          pickMeasurementValues(match),
                        );
                        if (!form.getValues("replaceDefaultGarmentTypeId")) {
                          form.setValue("replaceDefaultGarmentTypeId", nextId);
                        }
                      }}
                    />
                  </div>
                  <MeasurementFields
                    key={garmentTypeId}
                    register={form.register}
                    control={form.control}
                    errors={form.formState.errors}
                    namePrefix="measurement"
                  />
                  {fields.replaceDefault}
                  {replaceDefault ? (
                    <div className="space-y-1">
                      <Label>{t("orders.replaceDefaultType")}</Label>
                      <GarmentTypeSelect
                        types={types}
                        value={
                          (form.watch("replaceDefaultGarmentTypeId") as
                            | string
                            | undefined) || garmentTypeId
                        }
                        placeholder={t("orders.pickGarment")}
                        onChange={(nextId) =>
                          form.setValue("replaceDefaultGarmentTypeId", nextId)
                        }
                      />
                    </div>
                  ) : null}
                </section>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    createOrder.isPending ||
                    !garmentTypeId
                  }
                >
                  {isSubmitting || createOrder.isPending
                    ? t("common.actions.loading")
                    : t("orders.create")}
                </Button>
              </div>
            );
          }}
        </SchemaForm>
      )}
    </Page>
  );
}
