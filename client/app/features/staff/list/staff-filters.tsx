import type { TStaffListQuery } from "@moon-tailors/contracts";
import { staffListQuerySchema } from "@moon-tailors/contracts";
import type { ReactNode } from "react";
import { SchemaFilters } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { staffStatusOptions } from "../lib/labels";

type StaffFiltersProps = {
  values: Partial<TStaffListQuery>;
  onChange: (filters: Partial<TStaffListQuery>) => void;
  /** e.g. Add staff — sits beside the search field. */
  actions?: ReactNode;
};

export function StaffFilters({ values, onChange, actions }: StaffFiltersProps) {
  const { t } = useI18n();

  return (
    <SchemaFilters
      schema={staffListQuerySchema}
      values={values}
      names={["search", "status"]}
      onChange={onChange}
      fieldConfig={{
        search: {
          label: t("common.actions.search"),
          placeholder: t("staff.searchPlaceholder"),
        },
        status: {
          label: t("staff.status"),
          placeholder: t("staff.anyStatus"),
          options: [
            { label: t("staff.anyStatus"), value: "__any__" },
            ...staffStatusOptions(t),
          ],
        },
      }}
      showClear={false}
    >
      {({ fields }) => (
        <div className="flex w-full flex-wrap items-end gap-2">
          <div className="min-w-0 flex-1 basis-48">{fields.search}</div>
          <div className="w-36 shrink-0">{fields.status}</div>
          {actions ? (
            <div className="flex shrink-0 items-end gap-2">{actions}</div>
          ) : null}
        </div>
      )}
    </SchemaFilters>
  );
}
