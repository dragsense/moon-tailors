import {
  getFormFields,
  measurementValuesSchema,
} from "@moon-tailors/contracts";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { FieldControl } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";
import { cn } from "~/lib/utils";

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

function measurementLabelKey(fieldName: string): TranslationKey {
  if (fieldName === "extraNotes") return "measurements.notes";
  return `measurements.${fieldName}` as TranslationKey;
}

/** Field grid for nested or root measurement values. */
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
  const { t } = useI18n();
  const fields = getFormFields(measurementValuesSchema);

  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {fields.map((field) => {
        const name = (
          namePrefix ? `${namePrefix}.${field.name}` : field.name
        ) as Path<TFieldValues>;
        const errorPath = namePrefix
          ? `${namePrefix}.${field.name}`
          : field.name;
        const wide = field.meta.type === "textarea";
        const unit = t("measurements.unit");
        const label = t(measurementLabelKey(field.name));
        const meta = {
          ...field.meta,
          label: wide ? label : `${label} (${unit})`,
        };
        return (
          <div key={field.name} className={wide ? "col-span-2" : undefined}>
            <FieldControl
              name={name}
              meta={meta}
              register={register}
              control={control}
              error={nestedError(errors, errorPath)}
            />
          </div>
        );
      })}
    </div>
  );
}
