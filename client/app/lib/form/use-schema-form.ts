import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import type { FieldConfigMap } from "./field-config";
import {
  useSchemaFields,
  type SchemaFieldMap,
} from "./use-schema-fields";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type UseSchemaFormOptions<TSchema extends AnyZodObject> = {
  schema: TSchema;
  defaultValues?: Partial<z.infer<TSchema>>;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  /**
   * Override UI per field for this form instance (options from API,
   * hide/disable rules, custom inputs). Schema field() is still the default.
   */
  fieldConfig?: FieldConfigMap<z.infer<TSchema> & FieldValues>;
};

export type UseSchemaFormResult<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  /** Map of field name → control node (layout freely). */
  fields: SchemaFieldMap;
  isSubmitting: boolean;
  isValid: boolean;
};

/**
 * RHF form bound to a Zod schema + generated field nodes.
 *
 * @example
 * const { form, fields } = useSchemaForm({
 *   schema: createTaskSchema,
 *   fieldConfig: {
 *     title: { type: "select", options: titlesFromUsers },
 *     progress: { hidden: (v) => v.status === "todo" },
 *   },
 * });
 */
export function useSchemaForm<TSchema extends AnyZodObject>({
  schema,
  defaultValues,
  mode = "onChange",
  fieldConfig,
}: UseSchemaFormOptions<TSchema>): UseSchemaFormResult<z.infer<TSchema>> {
  type Values = z.infer<TSchema> & FieldValues;

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<Values> | undefined,
    mode,
    reValidateMode: "onChange",
  });

  const {
    register,
    control,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const { fields } = useSchemaFields<Values>({
    schema,
    register,
    control,
    errors,
    fieldConfig,
  });

  return {
    form,
    fields,
    isSubmitting,
    isValid,
  };
}
