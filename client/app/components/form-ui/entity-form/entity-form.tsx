import type { ReactNode } from "react";
import { FormProvider, type FieldValues, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import {
  useSchemaForm,
  type FieldConfigMap,
  type SchemaFieldMap,
} from "~/lib/form";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type EntityFormMode = "create" | "edit" | "upsert";

export type EntityFormCtx<TSchema extends AnyZodObject> = {
  mode: EntityFormMode;
  /** Present in edit (and upsert when record exists). */
  id?: string;
  fields: SchemaFieldMap;
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  isValid: boolean;
};

export type EntityFormProps<
  TCreate extends AnyZodObject,
  TUpdate extends AnyZodObject = TCreate,
> = {
  /** Schema used for create (and upsert). */
  createSchema: TCreate;
  /** Schema used for edit. Defaults to createSchema. */
  updateSchema?: TUpdate;
  /**
   * When set with an `id`, mode becomes `edit` (unless mode="upsert").
   * Omit / null → create.
   */
  record?: { id: string } | null;
  /**
   * - auto (default): edit if record?.id else create
   * - upsert: always one submit path (availability-style)
   * - create | edit: force
   */
  mode?: "auto" | EntityFormMode;
  defaultValues?: Partial<z.infer<TCreate> & z.infer<TUpdate>>;
  fieldConfig?: FieldConfigMap<(z.infer<TCreate> & z.infer<TUpdate>) & FieldValues>;
  onSubmit: (
    values: z.infer<TCreate> & z.infer<TUpdate>,
    ctx: { mode: EntityFormMode; id?: string },
  ) => void | Promise<void>;
  /**
   * Custom body — place fields freely (same as SchemaForm).
   * Receives mode/id so one component handles create + edit + upsert.
   */
  children?: (ctx: EntityFormCtx<TCreate | TUpdate>) => ReactNode;
  submitLabel?: string | ((mode: EntityFormMode) => string);
  className?: string;
};

/**
 * One form component for create / edit / upsert — no duplicated if/else forms.
 *
 * @example
 * <EntityForm
 *   createSchema={createBillingSchema}
 *   updateSchema={updateBillingSchema}
 *   record={billing}
 *   onSubmit={async (values, { mode, id }) => {
 *     if (mode === "edit") await update(id!, values);
 *     else await create(values);
 *   }}
 * >
 *   {({ fields, mode }) => (…)}
 * </EntityForm>
 */
export function EntityForm<
  TCreate extends AnyZodObject,
  TUpdate extends AnyZodObject = TCreate,
>({
  createSchema,
  updateSchema,
  record,
  mode: modeProp = "auto",
  defaultValues,
  fieldConfig,
  onSubmit,
  children,
  submitLabel,
  className,
}: EntityFormProps<TCreate, TUpdate>) {
  const resolvedMode: EntityFormMode =
    modeProp === "auto"
      ? record?.id
        ? "edit"
        : "create"
      : modeProp;

  const schema = (
    resolvedMode === "edit" ? (updateSchema ?? createSchema) : createSchema
  ) as TCreate | TUpdate;

  const { form, fields, isSubmitting, isValid } = useSchemaForm({
    schema: schema as TCreate,
    defaultValues: defaultValues as Partial<z.infer<TCreate>> | undefined,
    fieldConfig: fieldConfig as FieldConfigMap<z.infer<TCreate> & FieldValues>,
  });

  const ctx: EntityFormCtx<TCreate | TUpdate> = {
    mode: resolvedMode,
    id: record?.id,
    fields,
    form: form as UseFormReturn<z.infer<TCreate | TUpdate>>,
    isSubmitting,
    isValid,
  };

  const label =
    typeof submitLabel === "function"
      ? submitLabel(resolvedMode)
      : submitLabel ??
        (resolvedMode === "edit"
          ? "Save changes"
          : resolvedMode === "upsert"
            ? "Save"
            : "Create");

  return (
    <FormProvider {...form}>
      <form
        className={cn(!children && "space-y-4", className)}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values as z.infer<TCreate> & z.infer<TUpdate>, {
            mode: resolvedMode,
            id: record?.id,
          });
        })}
      >
        {children ? (
          children(ctx)
        ) : (
          <>
            {Object.values(fields)}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : label}
            </Button>
          </>
        )}
      </form>
    </FormProvider>
  );
}
