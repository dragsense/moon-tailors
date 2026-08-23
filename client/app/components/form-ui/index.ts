/**
 * Form UI only. Logic lives in `~/lib/form`.
 *
 * ```txt
 * form-ui/
 *   schema-form/     SchemaForm shell (+ fieldConfig)
 *   schema-filters/  SchemaFilters list bar (+ fieldConfig, custom layout)
 *   field-control    stock inputs by meta.type
 *   field-error
 * lib/form/
 *   field-config         FieldUiConfig types
 *   schema-field         hide/disable/options/render
 *   use-schema-form
 *   use-schema-fields
 *   use-schema-filters   debounced list-param sync
 * ```
 *
 * @example
 * import { SchemaForm, SchemaFilters } from "~/components/form-ui"
 * import { useSchemaForm, useSchemaFilters, FieldShell } from "~/lib/form"
 */
export {
  SchemaForm,
  type SchemaFormProps,
  type SchemaFormRenderCtx,
} from "./schema-form";
export {
  SchemaFilters,
  type SchemaFiltersProps,
  type SchemaFiltersRenderCtx,
} from "./schema-filters";
export {
  EntityForm,
  type EntityFormCtx,
  type EntityFormMode,
  type EntityFormProps,
} from "./entity-form";
export {
  SchemaSteps,
  SchemaStepsNav,
  type FormStep,
  type SchemaStepsCtx,
  type SchemaStepsProps,
} from "./schema-steps";
export { FieldControl, type FieldControlProps } from "./field-control";
export { FieldError } from "./field-error";
export { Stepper, type StepperItem, type StepperProps } from "./stepper";
export {
  FileUpload,
  type FileUploadProps,
  type FileUploadValue,
} from "./file-upload";
