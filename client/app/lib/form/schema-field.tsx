import type { ReactNode } from "react";
import type { IFieldMeta } from "@moon-tailors/contracts";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { FieldControl } from "~/components/form-ui/field-control";
import { FieldError } from "~/components/form-ui/field-error";
import { Label } from "~/components/ui/label";
import {
  mergeFieldMeta,
  resolveCondition,
  resolveOptions,
  type FieldUiConfig,
} from "./field-config";

export type SchemaFieldProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  meta: IFieldMeta;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  config?: FieldUiConfig<TFieldValues>;
};

/**
 * One schema field: watches form values for hide/disable/options, applies fieldConfig.
 */
export function SchemaField<TFieldValues extends FieldValues>({
  name,
  meta,
  register,
  control,
  errors,
  config,
}: SchemaFieldProps<TFieldValues>) {
  const values = (useWatch({ control }) ?? {}) as TFieldValues;

  if (resolveCondition(config?.hidden, values, false)) {
    return null;
  }

  const disabled = resolveCondition(config?.disabled, values, false);
  const baseMeta = mergeFieldMeta(meta, config);
  const resolvedMeta = {
    ...baseMeta,
    options: resolveOptions(config?.options, values, baseMeta.options ?? meta.options),
  };
  const error = errors[name]?.message as string | undefined;

  if (config?.render) {
    const render = config.render;
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const node = render({
            name,
            meta: resolvedMeta,
            error,
            disabled,
            control,
            register,
            field,
          });
          // Custom render owns full UI; optionally wrap is already included by consumer.
          return <>{node}</>;
        }}
      />
    );
  }

  return (
    <FieldControl
      name={name}
      meta={resolvedMeta}
      register={register}
      control={control}
      error={error}
      disabled={disabled}
    />
  );
}

/** Optional helper when writing custom fields with a standard label shell. */
export function FieldShell({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label ? <Label htmlFor={name}>{label}</Label> : null}
      {children}
      <FieldError message={error} />
    </div>
  );
}
