import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import {
  createOrderSchema,
  EOrderStatus,
  pickMeasurementValues,
  type ICustomer,
  type IOrder,
  type TCreateOrderData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { useI18n } from "~/hooks/use-i18n";
import type { SchemaFieldMap } from "~/lib/form";
import type { MutationOpComponentProps } from "~/ops";
import { useOp } from "~/ops";
import type { TranslationKey } from "~/locales";
import { MeasurementFields } from "~/features/measurements";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function asCustomer(payload: unknown): ICustomer | null {
  if (!payload || typeof payload !== "object") return null;
  if (!("id" in payload) || typeof (payload as { id: unknown }).id !== "string") {
    return null;
  }
  return payload as ICustomer;
}

export function CreateOrderModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
  payload,
  store,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const view = useOp(store, "viewOrder");
  const customer = asCustomer(payload);
  const [pending, setPending] = useState<TCreateOrderData | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  if (!isOpen || !customer) return null;

  const defaults = pickMeasurementValues(customer.measurement);

  async function placeOrder(replaceDefault: boolean) {
    if (!pending) return;
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      const created = (await submit({
        ...pending,
        replaceDefault,
      })) as IOrder | undefined;
      setPending(null);
      close();
      if (created?.id && view.kind === "mutation") {
        view.open(created);
      }
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : t("orders.loadFailed"),
      );
      setConfirmBusy(false);
    }
  }

  return (
    <>
      <Modal
        title={t("orders.new")}
        description={t("orders.newHint")}
        onClose={() => {
          setPending(null);
          close();
        }}
        className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"
        error={
          isError
            ? error instanceof Error
              ? error.message
              : t("orders.loadFailed")
            : null
        }
      >
        <p className="text-muted-foreground mb-4 text-sm">
          {customer.name}
          {customer.phone ? ` · ${customer.phone}` : ""}
        </p>
        <SchemaForm
          key={customer.id}
          schema={createOrderSchema}
          fieldConfig={{
            customerId: { hidden: true },
            measurement: { hidden: true },
            replaceDefault: { hidden: true },
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
          defaultValues={{
            customerId: customer.id,
            orderDate: todayIso(),
            expectedCompletionDate: plusDaysIso(7),
            status: EOrderStatus.NEW,
            totalCost: 0,
            paidAmount: 0,
            garmentType: "",
            measurement: defaults,
            replaceDefault: false,
          }}
          onSubmit={(values) => {
            setConfirmError(null);
            setPending({
              ...(values as TCreateOrderData),
              customerId: customer.id,
            });
          }}
        >
          {({ fields, form, isSubmitting }) => (
            <CreateOrderFields
              fields={fields}
              form={form as UseFormReturn<TCreateOrderData>}
              isSubmitting={isSubmitting}
              isPending={isPending}
            />
          )}
        </SchemaForm>
      </Modal>

      <Dialog
        open={pending != null}
        onOpenChange={(next) => {
          if (!next && !confirmBusy) {
            setPending(null);
            setConfirmError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{t("orders.replaceDefaultAskTitle")}</DialogTitle>
            <DialogDescription>
              {t("orders.replaceDefaultAsk")}
            </DialogDescription>
          </DialogHeader>
          {confirmError ? (
            <p className="text-sm text-destructive">{confirmError}</p>
          ) : null}
          <DialogFooter className="flex-col gap-2 border-t-0 bg-transparent p-0 sm:flex-col sm:space-x-0">
            <Button
              type="button"
              disabled={confirmBusy}
              onClick={() => void placeOrder(true)}
            >
              {confirmBusy
                ? t("common.actions.loading")
                : t("orders.replaceDefaultYes")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={confirmBusy}
              onClick={() => void placeOrder(false)}
            >
              {t("orders.replaceDefaultNo")}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={confirmBusy}
              onClick={() => {
                setPending(null);
                setConfirmError(null);
              }}
            >
              {t("common.actions.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CreateOrderFields({
  fields,
  form,
  isSubmitting,
  isPending,
}: {
  fields: SchemaFieldMap;
  form: UseFormReturn<TCreateOrderData>;
  isSubmitting: boolean;
  isPending: boolean;
}) {
  const { t } = useI18n();
  const garmentType = String(form.watch("garmentType") ?? "").trim();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <h3 className="font-heading text-sm font-semibold">
            {t("orders.details")}
          </h3>
          {fields.garmentType}
          {fields.orderDate}
          {fields.expectedCompletionDate}
          {fields.status}
          {fields.totalCost}
          {fields.paidAmount}
          {fields.notes}
        </section>
        <section className="space-y-4">
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
        </section>
      </div>
      <Button
        type="submit"
        disabled={isSubmitting || isPending || !garmentType}
      >
        {isSubmitting || isPending
          ? t("common.actions.loading")
          : t("orders.create")}
      </Button>
    </div>
  );
}
