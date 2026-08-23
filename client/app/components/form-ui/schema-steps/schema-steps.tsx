import { useState, type ReactNode } from "react";
import {
  FormProvider,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form";
import type { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  useSchemaForm,
  type FieldConfigMap,
  type SchemaFieldMap,
} from "~/lib/form";
import { cn } from "~/lib/utils";
import { Stepper } from "../stepper";

type AnyZodObject = z.ZodObject<z.ZodRawShape>;

export type FormStep = {
  id: string;
  label: string;
  description?: string;
  /** Schema field names belonging to this step (validated on Next). */
  fields: string[];
};

export type SchemaStepsCtx<TSchema extends AnyZodObject> = {
  step: FormStep;
  stepIndex: number;
  steps: FormStep[];
  isFirst: boolean;
  isLast: boolean;
  fields: SchemaFieldMap;
  /** Only fields for the current step (others stay mounted via hidden). */
  stepFields: SchemaFieldMap;
  form: UseFormReturn<z.infer<TSchema>>;
  isSubmitting: boolean;
  goNext: () => Promise<void>;
  goPrev: () => void;
  goTo: (index: number) => void;
};

export type SchemaStepsProps<TSchema extends AnyZodObject> = {
  schema: TSchema;
  steps: FormStep[];
  defaultValues?: Partial<z.infer<TSchema>>;
  fieldConfig?: FieldConfigMap<z.infer<TSchema> & FieldValues>;
  onSubmit: (values: z.infer<TSchema>) => void | Promise<void>;
  /**
   * Custom step body. All fields stay registered; hide non-active via CSS
   * so values persist across steps.
   */
  children: (ctx: SchemaStepsCtx<TSchema>) => ReactNode;
  className?: string;
  /** Show the circle stepper header (default true). */
  showStepper?: boolean;
};

/**
 * Multi-step SchemaForm wizard. Validates only the current step’s fields on Next.
 */
export function SchemaSteps<TSchema extends AnyZodObject>({
  schema,
  steps,
  defaultValues,
  fieldConfig,
  onSubmit,
  children,
  className,
  showStepper = true,
}: SchemaStepsProps<TSchema>) {
  const [stepIndex, setStepIndex] = useState(0);
  const { form, fields, isSubmitting } = useSchemaForm({
    schema,
    defaultValues,
    fieldConfig,
  });

  const step = steps[stepIndex]!;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const stepFields: SchemaFieldMap = {};
  for (const name of step.fields) {
    if (fields[name]) stepFields[name] = fields[name];
  }

  const goNext = async () => {
    const ok = await form.trigger(
      step.fields as Path<z.infer<TSchema> & FieldValues>[],
    );
    if (!ok) return;
    if (isLast) {
      await form.handleSubmit(onSubmit)();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));
  const goTo = (index: number) => {
    if (index >= 0 && index < steps.length) setStepIndex(index);
  };

  return (
    <FormProvider {...form}>
      <div className={cn("space-y-6", className)}>
        {showStepper ? (
          <Stepper
            currentStep={stepIndex}
            steps={steps.map((s) => ({
              label: s.label,
              description: s.description,
            }))}
            onStepClick={(index) => {
              if (index < stepIndex) goTo(index);
            }}
          />
        ) : null}

        {children({
          step,
          stepIndex,
          steps,
          isFirst,
          isLast,
          fields,
          stepFields,
          form,
          isSubmitting,
          goNext,
          goPrev,
          goTo,
        })}
      </div>
    </FormProvider>
  );
}

/** Default prev / next / submit row for SchemaSteps. */
export function SchemaStepsNav({
  isFirst,
  isLast,
  isSubmitting,
  onPrev,
  onNext,
  onCancel,
  nextLabel,
  submitLabel = "Confirm",
  cancelLabel = "Cancel",
}: {
  isFirst: boolean;
  isLast: boolean;
  isSubmitting?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onCancel?: () => void;
  nextLabel?: string;
  submitLabel?: string;
  cancelLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
      <div className="flex gap-2">
        {!isFirst ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onPrev}
          >
            Previous
          </Button>
        ) : null}
      </div>
      <div className="flex gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="button" disabled={isSubmitting} onClick={onNext}>
          {isSubmitting
            ? "Saving…"
            : isLast
              ? submitLabel
              : (nextLabel ?? "Next")}
        </Button>
      </div>
    </div>
  );
}
