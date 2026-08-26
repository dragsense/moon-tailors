import type { TMeasurementValues } from "@moon-tailors/contracts";
import { updateMeasurementSchema } from "@moon-tailors/contracts";
import { useEffect, useRef } from "react";
import { useSchemaForm } from "~/lib/form";
import { MeasurementFields } from "../components/measurement-fields";

/** Live-updating measurement editor (create flows). */
export function DraftMeasurementEditor({
  values,
  onChange,
}: {
  values?: TMeasurementValues;
  onChange: (values: TMeasurementValues) => void;
}) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const { form } = useSchemaForm({
    schema: updateMeasurementSchema,
    defaultValues: values,
    mode: "onChange",
  });

  useEffect(() => {
    const sub = form.watch((value) => {
      onChangeRef.current(value as TMeasurementValues);
    });
    return () => sub.unsubscribe();
  }, [form]);

  return (
    <MeasurementFields
      register={form.register}
      control={form.control}
      errors={form.formState.errors}
      namePrefix=""
    />
  );
}
