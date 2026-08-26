/**
 * Form logic (RHF + Zod schema → field map).
 * UI lives in `~/components/form-ui`.
 *
 * ```txt
 * lib/form/
 *   field-config.ts
 *   schema-field.tsx
 *   hooks/           useSchemaForm / Fields / Filters
 * ```
 */
export {
  type FieldConfigMap,
  type FieldRenderProps,
  type FieldUiConfig,
  type ResolvedFieldMeta,
  mergeFieldMeta,
  resolveCondition,
  resolveOptions,
} from "./field-config";
export { SchemaField, FieldShell, type SchemaFieldProps } from "./schema-field";
export {
  useSchemaFields,
  useSchemaForm,
  useSchemaFilters,
  cleanFilterValues,
  FILTER_ANY_VALUE,
  type SchemaFieldMap,
  type UseSchemaFieldsArgs,
  type UseSchemaFormOptions,
  type UseSchemaFormResult,
  type UseSchemaFiltersOptions,
  type UseSchemaFiltersResult,
} from "./hooks";
