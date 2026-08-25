import { useState } from "react";
import {
  EGarmentAudience,
  EPermissionAction,
  EResource,
  type IGarmentType,
} from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useSession } from "~/features/auth/hooks";
import { garmentTypesService } from "~/features/garment-types/api";
import { garmentTypeKeys } from "~/features/garment-types/query-keys";
import { useI18n } from "~/hooks/use-i18n";
import { hasPermission } from "~/lib/permissions";
import { queryClient } from "~/lib/query";
import { cn } from "~/lib/utils";

type EditorMode = "idle" | "create" | "edit";

export function GarmentTypeField({
  types,
  value,
  onChange,
  audience,
  filledIds,
}: {
  types: IGarmentType[];
  value: string;
  onChange: (id: string) => void;
  audience: EGarmentAudience;
  filledIds?: Set<string>;
}) {
  const { t } = useI18n();
  const session = useSession();
  const [mode, setMode] = useState<EditorMode>("idle");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = types.find((type) => type.id === value);
  const canCreate = hasPermission(session?.user, EResource.GARMENT_TYPES, [
    EPermissionAction.CREATE,
    EPermissionAction.MANAGE,
  ]);
  const canUpdate = hasPermission(session?.user, EResource.GARMENT_TYPES, [
    EPermissionAction.UPDATE,
    EPermissionAction.MANAGE,
  ]);
  const canDelete = hasPermission(session?.user, EResource.GARMENT_TYPES, [
    EPermissionAction.DELETE,
    EPermissionAction.MANAGE,
  ]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: garmentTypeKeys.all });
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        const created = await garmentTypesService.create({
          name: trimmed,
          audience,
          sortOrder: 0,
        });
        await refresh();
        onChange(created.id);
      } else if (mode === "edit" && selected) {
        await garmentTypesService.update(selected.id, { name: trimmed });
        await refresh();
      }
      setMode("idle");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("garmentTypes.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!selected) return;
    if (
      !window.confirm(
        t("garmentTypes.deleteConfirm", { name: selected.name }),
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await garmentTypesService.remove(selected.id);
      await refresh();
      const next = types.find((type) => type.id !== selected.id);
      onChange(next?.id ?? "");
      setMode("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("garmentTypes.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {types.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {types.map((type) => {
            const active = type.id === value;
            const filled = filledIds?.has(type.id);
            return (
              <Button
                key={type.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                disabled={busy}
                onClick={() => {
                  onChange(type.id);
                  if (mode === "edit") {
                    setName(type.name);
                  }
                }}
              >
                {type.name}
                {filled ? " ·" : ""}
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t("garmentTypes.empty")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {canCreate ? (
          <Button
            type="button"
            size="sm"
            variant={mode === "create" ? "default" : "outline"}
            disabled={busy}
            onClick={() => {
              setError(null);
              setMode(mode === "create" ? "idle" : "create");
              setName("");
            }}
          >
            {t("garmentTypes.new")}
          </Button>
        ) : null}
        {canUpdate && selected ? (
          <Button
            type="button"
            size="sm"
            variant={mode === "edit" ? "default" : "outline"}
            disabled={busy}
            onClick={() => {
              setError(null);
              if (mode === "edit") {
                setMode("idle");
                setName("");
                return;
              }
              setMode("edit");
              setName(selected.name);
            }}
          >
            {t("common.actions.edit")}
          </Button>
        ) : null}
        {canDelete && selected ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => {
              void removeSelected();
            }}
          >
            {t("common.actions.delete")}
          </Button>
        ) : null}
      </div>

      {mode !== "idle" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            className="h-11 text-base"
            value={name}
            placeholder={t("garmentTypes.namePlaceholder")}
            disabled={busy}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void save();
              }
            }}
          />
          <Button
            type="button"
            disabled={busy || !name.trim()}
            onClick={() => {
              void save();
            }}
          >
            {busy ? t("common.actions.loading") : t("common.actions.save")}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className={cn("text-sm text-destructive")}>{error}</p>
      ) : null}
    </div>
  );
}
