import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  createOrderSchema,
  EOrderStatus,
  pickMeasurementValues,
  type ICustomer,
  type TCreateOrderData,
} from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath, orderPath } from "~/config/routes.config";
import { MeasurementFields } from "~/features/customers/components/measurement-fields";

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

  useEffect(() => {
    if (customerId && params.id !== customerId) {
      setParams({ id: customerId });
    }
  }, [customerId, params.id, setParams]);

  if (createOrder.kind !== "mutation") return null;

  const customer = data as ICustomer | null | undefined;

  return (
    <Page title={t("orders.new")} description={t("orders.newHint")}>
      {isPending && !customer ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : (
        <SchemaForm
          key={customer?.id ?? customerId ?? "new-order"}
          schema={createOrderSchema}
          fieldConfig={{
            measurement: { hidden: true },
            replaceDefault: { label: t("orders.replaceDefault") },
          }}
          defaultValues={{
            customerId: customerId ?? "",
            orderDate: todayIso(),
            expectedCompletionDate: plusDaysIso(7),
            status: EOrderStatus.NEW,
            totalCost: 0,
            paidAmount: 0,
            measurement: pickMeasurementValues(customer?.defaultMeasurement),
            replaceDefault: false,
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
          {({ fields, form, isSubmitting }) => (
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
                <MeasurementFields
                  register={form.register}
                  control={form.control}
                  errors={form.formState.errors}
                  namePrefix="measurement"
                />
                {fields.replaceDefault}
              </section>
              <Button
                type="submit"
                disabled={isSubmitting || createOrder.isPending}
              >
                {isSubmitting || createOrder.isPending
                  ? t("common.actions.loading")
                  : t("orders.create")}
              </Button>
            </div>
          )}
        </SchemaForm>
      )}
    </Page>
  );
}
