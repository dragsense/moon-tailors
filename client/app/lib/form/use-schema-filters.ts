import { useEffect, useMemo, useRef } from "react";
import {
  LIST_QUERY_INTERNAL_KEYS,
  getFilterFormFields,
} from "@template/contracts";
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

/** Sentinel for "no filter" on selects (Radix disallows empty string values). */
export const FILTER_ANY_VALUE = "__any__";

export type UseSchemaFiltersOptions<TSchema extends AnyZodObject> = {
  schema: TSchema;
  /** Current list params (ops store). Used to seed + detect external clear. */
  values?: Partial<z.infer<TSchema>>;
  /**
 * Debounced filter patch. Caller merges into list params and resets `page`.
 * Empty object = no active filters (keep page/limit/_relations from parent).
 */
  onChange: (filters: Partial<z.infer<TSchema>>) => void;
  /** Debounce ms (default 400). */
  debounceMs?: number;
  /** Subset of filter field names (default: all non-internal, non-hidden). */
  names?: string[];
  fieldConfig?: FieldConfigMap<z.infer<TSchema> & FieldValues>;
};

export type UseSchemaFiltersResult<TFieldValues extends FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  fields: SchemaFieldMap;
  hasActiveFilters: boolean;
  clearFilters: () => void;
};

/** Strip empty / sentinel values so list params stay clean. */
export function cleanFilterValues<T extends Record<string, unknown>>(
  values: T,
): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(values)) {
    if (LIST_QUERY_INTERNAL_KEYS.includes(key as never)) continue;
    if (value === undefined || value === null || value === "") continue;
    if (value === FILTER_ANY_VALUE) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    (out as Record<string, unknown>)[key] = value;
  }
  return out;
}

function pickFilterDefaults<TSchema extends AnyZodObject>(
  schema: TSchema,
  values: Partial<z.infer<TSchema>> | undefined,
  names: string[],
): DefaultValues<z.infer<TSchema> & FieldValues> {
  const defaults: Record<string, unknown> = {};
  for (const name of names) {
    const raw = values?.[name as keyof typeof values];
    if (raw === undefined || raw === null || raw === "") {
      const field = getFilterFormFields(schema, { names: [name] })[0];
      const hasAnyOption = field?.meta.options?.some(
        (opt) => opt.value === FILTER_ANY_VALUE,
      );
      defaults[name] = hasAnyOption ? FILTER_ANY_VALUE : "";
    } else {
      defaults[name] = raw;
    }
  }
  return defaults as DefaultValues<z.infer<TSchema> & FieldValues>;
}

/**
 * Schema-driven list filters.
 * Same `field` / `fieldConfig` / custom `render` pipeline as SchemaForm,
 * syncs to list params instead of submit.
 */
export function useSchemaFilters<TSchema extends AnyZodObject>({
  schema,
  values,
  onChange,
  debounceMs = 400,
  names: namesProp,
  fieldConfig,
}: UseSchemaFiltersOptions<TSchema>): UseSchemaFiltersResult<
  z.infer<TSchema>
> {
  type Values = z.infer<TSchema> & FieldValues;

  const names = useMemo(() => {
    if (namesProp?.length) return namesProp;
    return getFilterFormFields(schema).map((f) => f.name);
  }, [schema, namesProp]);

  const form = useForm<Values>({
    defaultValues: pickFilterDefaults(schema, values, names),
    mode: "onChange",
  });

  const { register, control, reset, watch, formState: { errors } } = form;

  const { fields } = useSchemaFields<Values>({
    schema,
    register,
    control,
    errors,
    names,
    fieldConfig,
  });

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lastEmitted = useRef(
    JSON.stringify(
      cleanFilterValues((values ?? {}) as Record<string, unknown>),
    ),
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const sub = watch((formValues) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const cleaned = cleanFilterValues(
          formValues as Record<string, unknown>,
        );
        const key = JSON.stringify(cleaned);
        if (key === lastEmitted.current) return;
        lastEmitted.current = key;
        onChangeRef.current(cleaned as Partial<z.infer<TSchema>>);
      }, debounceMs);
    });
    return () => {
      if (timer) clearTimeout(timer);
      sub.unsubscribe();
    };
  }, [watch, debounceMs]);

  // External clear (e.g. parent setParams without filters) → reset form
  const valuesKey = JSON.stringify(
    cleanFilterValues((values ?? {}) as Record<string, unknown>),
  );
  useEffect(() => {
    if (valuesKey === lastEmitted.current) return;
    lastEmitted.current = valuesKey;
    reset(pickFilterDefaults(schema, values, names));
  }, [valuesKey, values, schema, names, reset]);

  const watched = watch();
  const hasActiveFilters =
    Object.keys(cleanFilterValues(watched as Record<string, unknown>)).length >
    0;

  const clearFilters = () => {
    lastEmitted.current = JSON.stringify({});
    reset(pickFilterDefaults(schema, {}, names));
    onChangeRef.current({});
  };

  return {
    form,
    fields,
    hasActiveFilters,
    clearFilters,
  };
}
