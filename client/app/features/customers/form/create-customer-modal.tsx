import { useState } from "react";
import {
  createCustomerSchema,
  EGender,
  hasMeasurementValues,
  type TCreateCustomerData,
  type TMeasurementValues,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { SchemaFieldMap } from "~/lib/form";
import { DraftMeasurementEditor } from "~/features/measurements";
import type { MutationOpComponentProps } from "~/ops";

export function CreateCustomerModal({
  isOpen,
  isError,
  error,
  close,
  submit,
  isPending,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState<TMeasurementValues>({});
  if (!isOpen) return null;

  return (
    <Modal
      title={t("customers.new")}
      description={t("customers.createHint")}
      onClose={() => {
        setDraft({});
        close();
      }}
      className="max-h-[90vh] overflow-y-auto sm:max-w-5xl"
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
        defaultValues={{ gender: EGender.MALE }}
        fieldConfig={{
          measurement: { hidden: true },
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
        onSubmit={async (values) => {
          const data = values as TCreateCustomerData;
          await submit({
            ...data,
            measurement: hasMeasurementValues(draft) ? draft : undefined,
          });
          setDraft({});
          close();
        }}
      >
        {({ fields, isSubmitting }) => (
          <CreateCustomerFields
            fields={fields}
            isSubmitting={isSubmitting}
            isPending={isPending}
            draft={draft}
            onDraftChange={setDraft}
          />
        )}
      </SchemaForm>
    </Modal>
  );
}

function CreateCustomerFields({
  fields,
  isSubmitting,
  isPending,
  draft,
  onDraftChange,
}: {
  fields: SchemaFieldMap;
  isSubmitting: boolean;
  isPending: boolean;
  draft: TMeasurementValues;
  onDraftChange: (values: TMeasurementValues) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <section className="space-y-4">
          <h3 className="font-heading text-sm font-semibold">
            {t("customers.details")}
          </h3>
          {fields.name}
          {fields.gender}
          {fields.phone}
          {fields.alternative}
          {fields.address}
          {fields.notes}
        </section>
        <section className="space-y-4">
          <div>
            <h3 className="font-heading text-sm font-semibold">
              {t("customers.defaultMeasurements")}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t("customers.measurementsHint")}
            </p>
          </div>
          <DraftMeasurementEditor values={draft} onChange={onDraftChange} />
        </section>
      </div>
      <Button type="submit" disabled={isSubmitting || isPending}>
        {isSubmitting || isPending
          ? t("common.actions.loading")
          : t("customers.create")}
      </Button>
    </div>
  );
}
