import type { IMeasurement, TMeasurementValues } from "@moon-tailors/contracts";
import { updateMeasurementSchema } from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { MeasurementFields } from "../components/measurement-fields";

export function MeasurementForm({
  measurement,
  submitLabel,
  onSubmit,
}: {
  measurement?: IMeasurement | TMeasurementValues | null;
  submitLabel: string;
  onSubmit: (values: TMeasurementValues) => void | Promise<void>;
}) {
  const { t } = useI18n();
  return (
    <SchemaForm
      schema={updateMeasurementSchema}
      defaultValues={measurement ?? undefined}
      onSubmit={async (values): Promise<void> => {
        await onSubmit(values as TMeasurementValues);
      }}
    >
      {({ form, isSubmitting }) => (
        <div className="space-y-4">
          <MeasurementFields
            register={form.register}
            control={form.control}
            errors={form.formState.errors}
            namePrefix=""
          />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common.actions.loading") : submitLabel}
          </Button>
        </div>
      )}
    </SchemaForm>
  );
}
