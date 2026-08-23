import type { ReactNode } from "react";
import type { IFieldMeta, IFieldOption, TFieldUiType } from "@template/contracts";
import type {
  Control,
  ControllerRenderProps,
  FieldValues,
  Path,
  UseFormRegister,
} from "react-hook-form";

/**
 * Per-field UI overrides for one form instance.
 * Schema `field()` meta is the default; this layer wins.
 *
 * Patterns:
 * - label / placeholder / type / options → tweak stock controls
 * - options from API → pass array from parent (re-renders update select)
 * - options from other fields → (values) => … with useWatch under the hood
 * - hide / disable by values or bool
 * - full custom control → render()
 */
export type FieldUiConfig<TValues extends FieldValues = FieldValues> = {
  label?: string;
  placeholder?: string;
  /** Force control type (e.g. text → select when options come from API). */
  type?: TFieldUiType;
  options?: IFieldOption[] | ((values: TValues) => IFieldOption[]);
  disabled?: boolean | ((values: TValues) => boolean);
  hidden?: boolean | ((values: TValues) => boolean);
  /**
   * Replace the stock control. Still receives label shell props if you use them;
   * return the full field UI (label + input + error) or just the control.
   */
  render?: (props: FieldRenderProps<TValues>) => ReactNode;
};

/** Prefer schema object keys; Path for nested later. */
export type FieldConfigMap<TValues extends FieldValues> = {
  [K in Extract<keyof TValues, string>]?: FieldUiConfig<TValues>;
};

/** Meta after schema defaults + static fieldConfig merges (before value-driven options). */
export type ResolvedFieldMeta = IFieldMeta & {
  label?: string;
  placeholder?: string;
  type: TFieldUiType;
  options?: IFieldOption[];
};

export type FieldRenderProps<TValues extends FieldValues> = {
  name: Path<TValues>;
  meta: ResolvedFieldMeta;
  error?: string;
  disabled: boolean;
  control: Control<TValues>;
  register: UseFormRegister<TValues>;
  /** Controllers: value / onChange / onBlur / ref for controlled components. */
  field: ControllerRenderProps<TValues, Path<TValues>>;
};

export function resolveCondition<TValues extends FieldValues>(
  rule: boolean | ((values: TValues) => boolean) | undefined,
  values: TValues,
  fallback = false,
): boolean {
  if (rule === undefined) return fallback;
  return typeof rule === "function" ? rule(values) : rule;
}

export function resolveOptions<TValues extends FieldValues>(
  options: FieldUiConfig<TValues>["options"] | undefined,
  values: TValues,
  fallback?: IFieldOption[],
): IFieldOption[] | undefined {
  if (options === undefined) return fallback;
  return typeof options === "function" ? options(values) : options;
}

/** Merge schema meta with static (non-value) overrides from fieldConfig. */
export function mergeFieldMeta(
  base: IFieldMeta,
  ui?: Pick<FieldUiConfig, "label" | "placeholder" | "type">,
): ResolvedFieldMeta {
  return {
    ...base,
    ...(ui?.label !== undefined ? { label: ui.label } : null),
    ...(ui?.placeholder !== undefined ? { placeholder: ui.placeholder } : null),
    ...(ui?.type !== undefined ? { type: ui.type } : null),
    type: ui?.type ?? base.type,
  };
}
