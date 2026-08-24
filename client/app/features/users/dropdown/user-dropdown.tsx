import { useEffect, useState } from "react";
import type { IPaginatedResponse } from "@moon-tailors/contracts";
import { FieldShell } from "~/lib/form";
import type { QueryOpComponentProps } from "~/ops";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { userDisplayName, type TUserRow } from "../api";

const NONE = "__none__";

type TUserOption = Pick<TUserRow, "id" | "email"> & {
  firstName?: string;
  lastName?: string;
  name?: string;
};

/**
 * listUsersDropdown.component — searchable user picker.
 * When `field` is set (via OpsComponent), binds as a form control.
 */
export function UserDropdown({
  data,
  isPending,
  params,
  setParams,
  field,
}: QueryOpComponentProps) {
  const items = (data as IPaginatedResponse<TUserRow> | undefined)?.data ?? [];
  const [search, setSearch] = useState(String(params.search ?? ""));
  const selectedOption = field?.selectedOption;
  const options: TUserOption[] =
    selectedOption && !items.some((user) => user.id === selectedOption.value)
      ? [
          {
            id: selectedOption.value,
            name: selectedOption.label,
            email: selectedOption.description ?? "",
          },
          ...items,
        ]
      : items;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = search.trim();
      if (next !== String(params.search ?? "")) {
        setParams({ search: next });
      }
    }, 300);
    return () => window.clearTimeout(handle);
  }, [search, params.search, setParams]);

  const raw = field?.value;
  const selected =
    raw == null || raw === "" ? undefined : String(raw as string);

  return (
    <FieldShell
      name={field?.name ?? "assignee"}
      label={field?.label ?? "Assignee"}
      error={field?.error}
    >
      <div className="space-y-2">
        <Input
          type="search"
          placeholder="Search users…"
          value={search}
          disabled={field?.disabled}
          onChange={(e) => setSearch(e.target.value)}
          onBlur={field?.onBlur}
        />
        <Select
          value={selected ?? NONE}
          disabled={field?.disabled || isPending}
          onValueChange={(v) => {
            field?.onChange(
              (v === NONE ? null : v) as typeof field.value,
            );
          }}
        >
          <SelectTrigger className="w-full" aria-invalid={Boolean(field?.error)}>
            <SelectValue placeholder="Select a user…" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No assignee</SelectItem>
            {options.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {userDisplayName(user)}
                {user.email ? (
                  <span className="ml-1 text-muted-foreground">
                    ({user.email})
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isPending ? (
          <p className="text-xs text-muted-foreground">Loading users…</p>
        ) : null}
      </div>
    </FieldShell>
  );
}
