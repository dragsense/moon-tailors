import type { IFieldMeta } from "@template/contracts";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { FieldError } from "./field-error";

export type FieldControlProps<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  meta: IFieldMeta;
  register: UseFormRegister<TFieldValues>;
  control: Control<TFieldValues>;
  error?: string;
  disabled?: boolean;
};

/** Renders one control from resolved meta (schema field() + fieldConfig). */
export function FieldControl<TFieldValues extends FieldValues>({
  name,
  meta,
  register,
  control,
  error,
  disabled = false,
}: FieldControlProps<TFieldValues>) {
  const label = meta.label ?? String(name);

  if (meta.type === "hidden") {
    return <input type="hidden" {...register(name)} />;
  }

  if (meta.type === "switch") {
    return (
      <div className="flex items-center gap-3">
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Switch
              id={name}
              checked={Boolean(field.value)}
              disabled={disabled}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor={name}>{label}</Label>
        <FieldError message={error} />
      </div>
    );
  }

  if (meta.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Textarea
          id={name}
          placeholder={meta.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          {...register(name)}
        />
        <FieldError message={error} />
      </div>
    );
  }

  if (meta.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={name}>{label}</Label>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <Select
              value={field.value != null && field.value !== "" ? String(field.value) : undefined}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={name}
                className="w-full"
                aria-invalid={Boolean(error)}
              >
                <SelectValue placeholder={meta.placeholder ?? "Select…"} />
              </SelectTrigger>
              <SelectContent>
                {(meta.options ?? []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError message={error} />
      </div>
    );
  }

  const inputType =
    meta.type === "email" ||
    meta.type === "password" ||
    meta.type === "number" ||
    meta.type === "date"
      ? meta.type
      : "text";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type={inputType}
        placeholder={meta.placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        {...register(name)}
      />
      <FieldError message={error} />
    </div>
  );
}
