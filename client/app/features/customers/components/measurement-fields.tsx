import type { IMeasurement } from "@moon-tailors/contracts";
import { updateMeasurementSchema } from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";

const MEASURE_FIELDS = [
  "length",
  "chest",
  "waist",
  "hip",
  "shoulder",
  "sleeve",
  "neck",
  "armhole",
  "cuff",
  "trouserLength",
  "thigh",
  "bottom",
] as const;

export function MeasurementReadout({
  measurement,
}: {
  measurement?: IMeasurement | null;
}) {
  const { t } = useI18n();

  if (!measurement) {
    return (
      <p className="text-muted-foreground text-base">{t("measurements.empty")}</p>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-base sm:grid-cols-3">
      {measurement.garmentType ? (
        <div>
          <dt className="text-muted-foreground text-xs">
            {t("measurements.garment")}
          </dt>
          <dd className="font-medium">{measurement.garmentType}</dd>
        </div>
      ) : null}
      {MEASURE_FIELDS.map((key) => {
        const value = measurement[key];
        if (value == null) return null;
        return (
          <div key={key}>
            <dt className="text-muted-foreground text-xs">
              {t(`measurements.${key}` as TranslationKey)}
            </dt>
            <dd className="font-medium tabular-nums">{value}</dd>
          </div>
        );
      })}
      {measurement.extraNotes ? (
        <div className="col-span-full">
          <dt className="text-muted-foreground text-xs">
            {t("measurements.notes")}
          </dt>
          <dd>{measurement.extraNotes}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function MeasurementForm({
  measurement,
  submitLabel,
  onSubmit,
}: {
  measurement?: IMeasurement | null;
  submitLabel: string;
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
}) {
  return (
    <SchemaForm
      schema={updateMeasurementSchema}
      defaultValues={measurement ?? undefined}
      submitLabel={submitLabel}
      onSubmit={onSubmit}
    />
  );
}
