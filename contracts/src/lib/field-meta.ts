import type { z } from "zod";
import type {
  IFieldMeta,
  IFormFieldConfig,
  TListFilterSpec,
  TQueryFilterKind,
} from "./field-meta.types.js";
import { LIST_QUERY_INTERNAL_KEYS } from "./list-query.constants.js";

const fieldMetaStore = new WeakMap<z.ZodTypeAny, IFieldMeta>();

/** Attach UI metadata to a Zod field (form generation source of truth). */
export function field<T extends z.ZodTypeAny>(
  schema: T,
  meta: IFieldMeta,
): T {
  fieldMetaStore.set(schema, {
    required: !schema.isOptional(),
    ...meta,
  });
  return schema;
}

export function getFieldMeta(schema: z.ZodTypeAny): IFieldMeta | undefined {
  return fieldMetaStore.get(schema);
}

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current: z.ZodTypeAny = schema;
  while (
    current._def?.typeName === "ZodOptional" ||
    current._def?.typeName === "ZodNullable" ||
    current._def?.typeName === "ZodDefault"
  ) {
    current = (current as z.ZodOptional<z.ZodTypeAny>)._def.innerType;
  }
  return current;
}

function inferMeta(schema: z.ZodTypeAny): IFieldMeta {
  const attached = getFieldMeta(schema) ?? getFieldMeta(unwrap(schema));
  if (attached) return attached;

  const inner = unwrap(schema);
  const typeName = inner._def?.typeName as string | undefined;

  if (typeName === "ZodBoolean") {
    return { type: "switch", required: !schema.isOptional() };
  }
  if (typeName === "ZodNumber") {
    return { type: "number", required: !schema.isOptional() };
  }
  if (typeName === "ZodEnum" || typeName === "ZodNativeEnum") {
    const values =
      typeName === "ZodEnum"
        ? ((inner._def.values as string[]) ?? [])
        : Object.values(inner._def.values as Record<string, string>).filter(
            (v) => typeof v === "string",
          );
    return {
      type: "select",
      required: !schema.isOptional(),
      options: values.map((value) => ({ label: value, value })),
    };
  }

  return { type: "text", required: !schema.isOptional() };
}

/** Build form field configs from a Zod object schema for auto-rendered forms. */
export function getFormFields(
  schema: z.ZodObject<z.ZodRawShape>,
): IFormFieldConfig[] {
  const shape = schema.shape;
  const fields = Object.entries(shape).map(([name, fieldSchema]) => {
    const zodField = fieldSchema as z.ZodTypeAny;
    return {
      name,
      schema: zodField,
      meta: {
        label: name,
        ...inferMeta(zodField),
      },
    };
  });

  return fields.sort(
    (a, b) => (a.meta.order ?? 999) - (b.meta.order ?? 999),
  );
}

/**
 * Fields meant for list filter bars: skips pagination/join/sort internals
 * and `type: "hidden"` meta (unless `includeHidden`).
 */
export function getFilterFormFields(
  schema: z.ZodObject<z.ZodRawShape>,
  options?: { includeHidden?: boolean; names?: string[] },
): IFormFieldConfig[] {
  const internal = new Set<string>(LIST_QUERY_INTERNAL_KEYS);
  let fields = getFormFields(schema).filter((f) => !internal.has(f.name));
  if (!options?.includeHidden) {
    fields = fields.filter((f) => f.meta.type !== "hidden");
  }
  if (options?.names?.length) {
    const allow = new Set(options.names);
    fields = fields.filter((f) => allow.has(f.name));
  }
  return fields;
}

/**
 * Build server `EntityQueryConfig.filters` from list-query Zod schema.
 * Only keys with `field({ filter: "eq" | "in" | … })` are included.
 */
export function filtersFromListSchema(
  schema: z.ZodObject<z.ZodRawShape>,
): Record<string, TListFilterSpec> {
  const internal = new Set<string>(LIST_QUERY_INTERNAL_KEYS);
  const out: Record<string, TListFilterSpec> = {};

  for (const [name, fieldSchema] of Object.entries(schema.shape)) {
    if (internal.has(name)) continue;
    const zodField = fieldSchema as z.ZodTypeAny;
    const meta = getFieldMeta(zodField) ?? getFieldMeta(unwrap(zodField));
    if (!meta?.filter) continue;

    const kind = meta.filter as TQueryFilterKind;
    out[name] = {
      type: kind,
      column: meta.filterColumn ?? name,
    };
  }

  return out;
}

export type {
  IFieldMeta,
  IFieldOption,
  IFormFieldConfig,
  TFieldUiType,
  TListFilterSpec,
  TQueryFilterKind,
} from "./field-meta.types.js";
