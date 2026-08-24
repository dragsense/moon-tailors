import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  useSchemaForm,
  type SchemaFieldMap,
  type UseSchemaFormOptions,
} from "~/lib/form";
import { cn } from "~/lib/utils";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type SchemaFormRenderCtx<TSchema extends AnyZodObject> = {
  /** Generated controls keyed by field name — place in any layout. */
  fields: SchemaFieldMap;
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  isValid: boolean;
};

export type SchemaFormProps<TSchema extends AnyZodObject> =
  UseSchemaFormOptions<TSchema> & {
    onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
    /**
     * Custom body. You own layout + submit UI.
     * If omitted, all fields stack vertically with a submit button.
     */
    children?: (ctx: SchemaFormRenderCtx<TSchema>) => ReactNode;
    /** Auto-layout only: submit button label. */
    submitLabel?: string;
    className?: string;
  };

/**
 * Schema-driven form shell (UI only — logic in `~/lib/form`).
 *
 * Defaults from schema `field()`; per-form UI via `fieldConfig`:
 *
 * ```tsx
 * <SchemaForm
 *   schema={createTaskSchema}
 *   fieldConfig={{
 *     // Remote list → select (validation still string/id from schema)
 *     title: {
 *       type: "select",
 *       label: "Title",
 *       options: users.map((u) => ({ label: u.name, value: u.name })),
 *     },
 *     // Conditions from other fields
 *     progress: {
 *       hidden: (v) => v.status === "todo",
 *       disabled: (v) => v.status === "done",
 *     },
 *     // Fully custom control
 *     description: {
 *       render: ({ field, meta, error, disabled }) => (
 *         <MyEditor value={field.value} onChange={field.onChange} disabled={disabled} />
 *       ),
 *     },
 *   }}
 *   onSubmit={…}
 * />
 * ```
 */
export function SchemaForm<TSchema extends AnyZodObject>({
  schema,
  onSubmit,
  defaultValues,
  mode,
  fieldConfig,
  children,
  submitLabel = "Submit",
  className,
}: SchemaFormProps<TSchema>) {
  const { form, fields, isSubmitting, isValid } = useSchemaForm({
    schema,
    defaultValues,
    mode,
    fieldConfig,
  });

  const ctx: SchemaFormRenderCtx<TSchema> = {
    fields,
    form,
    isSubmitting,
    isValid,
  };

  return (
    <form
      className={cn(!children && "space-y-4", className)}
      onSubmit={form.handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      {children ? (
        children(ctx)
      ) : (
        <>
          {Object.values(fields)}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </>
      )}
    </form>
  );
}
