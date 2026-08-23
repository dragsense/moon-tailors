import { useFieldArray, useFormContext } from "react-hook-form";
import type { TCreateBilling } from "@template/contracts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function BillingLineItemsFields() {
  const { control, register } = useFormContext<TCreateBilling>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Line items</h3>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            append({ description: "", quantity: 1, unitPrice: 0 })
          }
        >
          Add line
        </Button>
      </div>
      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-4"
        >
          <div className="sm:col-span-2 space-y-1">
            <Label className="text-xs">Description</Label>
            <Input {...register(`lineItems.${index}.description`)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Qty</Label>
            <Input
              type="number"
              step="1"
              {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Unit price</Label>
            <Input
              type="number"
              step="0.01"
              {...register(`lineItems.${index}.unitPrice`, {
                valueAsNumber: true,
              })}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => remove(index)}
            disabled={fields.length <= 1}
          >
            Remove
          </Button>
        </div>
      ))}
    </div>
  );
}
