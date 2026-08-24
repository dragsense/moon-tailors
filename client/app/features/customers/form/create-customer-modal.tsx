import {
  createCustomerSchema,
  type TCreateCustomerData,
} from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/layout-ui";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { MeasurementFields } from "../components/measurement-fields";

export function CreateCustomerModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <Modal
      title={t("customers.new")}
      description={t("customers.createHint")}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("customers.loadFailed")
          : null
      }
    >
      <SchemaForm
        schema={createCustomerSchema}
        fieldConfig={{ defaultMeasurement: { hidden: true } }}
        onSubmit={async (values) => {
          await submit(values as TCreateCustomerData);
          close();
        }}
      >
        {({ fields, form, isSubmitting }) => (
          <div className="space-y-6">
            <div className="space-y-4">
              {fields.name}
              {fields.phone}
              {fields.whatsapp}
              {fields.email}
              {fields.address}
              {fields.notes}
            </div>
            <section className="space-y-3 rounded-xl border border-border/60 p-4">
              <div>
                <h3 className="font-heading text-sm font-semibold">
                  {t("customers.defaultMeasurements")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("customers.measurementsHint")}
                </p>
              </div>
              <MeasurementFields
                register={form.register}
                control={form.control}
                errors={form.formState.errors}
                namePrefix="defaultMeasurement"
              />
            </section>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {isSubmitting || isPending
                ? t("common.actions.loading")
                : t("customers.create")}
            </Button>
          </div>
        )}
      </SchemaForm>
    </Modal>
  );
}
