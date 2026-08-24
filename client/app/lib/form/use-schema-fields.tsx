import { useMemo, type ReactNode } from "react";
import type { IFormFieldConfig } from "@moon-tailors/contracts";
import { getFormFields } from "@moon-tailors/contracts";
import type {
  Control,
  FieldErrors,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";
import type { z } from "zod";
import type { FieldConfigMap, FieldUiConfig } from "./field-config";
import { SchemaField } from "./schema-field";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

/** field name → ready-to-place control (reactive to form values + fieldConfig). */
export type SchemaFieldMap = Record<string, ReactNode>;

export type UseSchemaFieldsArgs<TFieldValues extends FieldValues> = {
  schema: AnyZodObject;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  /** Only build these names (default: all schema fields). */
  names?: string[];
  /**
   * Per-instance UI: labels, placeholders, options, hide/disable, custom render.
   * Schema `field()` meta remains the default.
   */
  fieldConfig?: FieldConfigMap<TFieldValues>;
};

/**
 * Build a map of field React nodes from a Zod schema + RHF state.
 * Place them in any layout: two columns, sections, etc.
 *
 * @example
 * const fields = useSchemaFields({
 *   schema, register, control, errors,
 *   fieldConfig: {
 *     title: {
 *       type: "select",
 *       options: users.map((u) => ({ label: u.name, value: u.name })),
 *     },
 *     progress: {
 *       hidden: (v) => v.status === "todo",
 *       disabled: (v) => v.status === "done",
 *     },
 *   },
 * });
 */
export function useSchemaFields<TFieldValues extends FieldValues>({
  schema,
  register,
  control,
  errors,
  names,
  fieldConfig,
}: UseSchemaFieldsArgs<TFieldValues>): {
  fields: SchemaFieldMap;
  fieldList: IFormFieldConfig[];
} {
  const fieldList = useMemo(() => {
    const all = getFormFields(schema);
    if (!names?.length) return all;
    const allow = new Set(names);
    return all.filter((f) => allow.has(f.name));
  }, [schema, names]);

  const fields = useMemo(() => {
    const map: SchemaFieldMap = {};
    for (const f of fieldList) {
      const name = f.name as Path<TFieldValues>;
      map[f.name] = (
        <SchemaField
          key={f.name}
          name={name}
          meta={f.meta}
          register={register}
          control={control}
          errors={errors}
          config={
            fieldConfig?.[
              f.name as Extract<keyof TFieldValues, string>
            ] as FieldUiConfig<TFieldValues> | undefined
          }
        />
      );
    }
    return map;
  }, [fieldList, register, control, errors, fieldConfig]);

  return { fields, fieldList };
}
