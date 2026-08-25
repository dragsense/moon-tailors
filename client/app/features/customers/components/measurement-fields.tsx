import type { IGarmentType, IMeasurement, TMeasurementValues } from "@moon-tailors/contracts";
import {
  getFormFields,
  measurementValuesSchema,
  updateMeasurementSchema,
} from "@moon-tailors/contracts";
import { useEffect, useRef, useState } from "react";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import { FieldControl, SchemaForm } from "~/components/form-ui";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { useSchemaForm } from "~/lib/form";
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
        const name = (
          namePrefix ? `${namePrefix}.${field.name}` : field.name
        ) as Path<TFieldValues>;
        const errorPath = namePrefix
          ? `${namePrefix}.${field.name}`
          : field.name;
        const wide = field.meta.type === "textarea";
        return (
          <div key={field.name} className={wide ? "sm:col-span-2" : undefined}>
            <FieldControl
              name={name}
              meta={field.meta}
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

export function MeasurementReadout({
  measurement,
}: {
  measurement?: IMeasurement | TMeasurementValues | null;
}) {
  const { t } = useI18n();
  const typeName =
    measurement && "garmentType" in measurement
      ? measurement.garmentType?.name
      : undefined;

  if (!measurement) {
    return (
      <p className="text-muted-foreground text-base">{t("measurements.empty")}</p>
    );
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-base sm:grid-cols-3">
      {typeName ? (
        <div>
          <dt className="text-muted-foreground text-xs">
            {t("measurements.garment")}
          </dt>
          <dd className="font-medium">{typeName}</dd>
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
  measurement?: IMeasurement | TMeasurementValues | null;
  submitLabel: string;
  onSubmit: (values: TMeasurementValues) => void | Promise<void>;
}) {
  return (
    <SchemaForm
      schema={updateMeasurementSchema}
      defaultValues={measurement ?? undefined}
      submitLabel={submitLabel}
      onSubmit={(values) => onSubmit(values as TMeasurementValues)}
    />
  );
}

export function DraftMeasurementEditor({
  values,
  onChange,
}: {
  values?: TMeasurementValues;
  onChange: (values: TMeasurementValues) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { form } = useSchemaForm({
    schema: updateMeasurementSchema,
    defaultValues: values,
    mode: "onChange",
  });

  useEffect(() => {
    const sub = form.watch((value) => {
      onChangeRef.current(value as TMeasurementValues);
    });
    return () => sub.unsubscribe();
  }, [form]);

  return (
    <MeasurementFields
      register={form.register}
      control={form.control}
      errors={form.formState.errors}
      namePrefix=""
    />
  );
}

const selectClassName =
  "h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function GarmentTypeSelect({
  types,
  value,
  onChange,
  placeholder,
  id,
}: {
  types: IGarmentType[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      className={selectClassName}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder ?? ""}</option>
      {types.map((type) => (
        <option key={type.id} value={type.id}>
          {type.name}
        </option>
      ))}
    </select>
  );
}

export function CopyFromRow({
  types,
  onCopy,
}: {
  types: IGarmentType[];
  onCopy: (fromGarmentTypeId: string) => void;
}) {
  const { t } = useI18n();
  const [fromId, setFromId] = useState("");
  if (types.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-1">
        <Label>{t("measurements.copyFrom")}</Label>
        <GarmentTypeSelect
          types={types}
          value={fromId}
          onChange={setFromId}
          placeholder={t("measurements.pickSource")}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={!fromId}
        onClick={() => {
          if (!fromId) return;
          onCopy(fromId);
        }}
      >
        {t("measurements.copy")}
      </Button>
    </div>
  );
}
