import type { IMeasurement } from "@moon-tailors/contracts";
import {
  getFormFields,
  measurementValuesSchema,
  updateMeasurementSchema,
} from "@moon-tailors/contracts";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { FieldControl, SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";
import { cn } from "~/lib/utils";

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

function nestedError(errors: FieldErrors, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = errors;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  if (current && typeof current === "object" && "message" in current) {
    const message = (current as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }
  return undefined;
}

export function MeasurementFields<TFieldValues extends FieldValues>({
  register,
  control,
  errors,
  namePrefix,
  className,
}: {
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  namePrefix: string;
  className?: string;
}) {
  const fields = getFormFields(measurementValuesSchema);

  return (
    <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", className)}>
      {fields.map((field) => {
        const name = `${namePrefix}.${field.name}` as Path<TFieldValues>;
        const wide =
          field.meta.type === "select" || field.meta.type === "textarea";
        return (
          <div key={field.name} className={wide ? "sm:col-span-2" : undefined}>
            <FieldControl
              name={name}
              meta={field.meta}
              register={register}
              control={control}
              error={nestedError(errors, `${namePrefix}.${field.name}`)}
            />
          </div>
        );
      })}
    </div>
  );
}

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
