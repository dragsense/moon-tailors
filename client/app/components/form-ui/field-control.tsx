import type { IFieldMeta } from "@moon-tailors/contracts";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
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
import { useI18n } from "~/hooks/use-i18n";
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
  const { t } = useI18n();
  const [showPassword, setShowPassword] = useState(false);
  const label = meta.label ?? String(name);
  const selectPlaceholder =
    meta.placeholder ?? t("common.actions.select");

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
              value={
                field.value != null && field.value !== ""
                  ? String(field.value)
                  : undefined
              }
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={name}
                className="w-full"
                aria-invalid={Boolean(error)}
              >
                <SelectValue placeholder={selectPlaceholder} />
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

  const isPassword = meta.type === "password";
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
      <div className="relative">
        <Input
          id={name}
          type={isPassword && showPassword ? "text" : inputType}
          placeholder={meta.placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={isPassword ? "pe-10" : undefined}
          {...register(name)}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={disabled}
            aria-label={
              showPassword
                ? t("common.actions.hidePassword")
                : t("common.actions.showPassword")
            }
            aria-pressed={showPassword}
            className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </button>
        ) : null}
      </div>
      <FieldError message={error} />
    </div>
  );
}
