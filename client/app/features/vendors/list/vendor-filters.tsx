import type { TVendorListQuery } from "@moon-tailors/contracts";
import { vendorListQuerySchema } from "@moon-tailors/contracts";
import type { ReactNode } from "react";
import { SchemaFilters } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";

type VendorFiltersProps = {
  values: Partial<TVendorListQuery>;
  onChange: (filters: Partial<TVendorListQuery>) => void;
  /** e.g. Add vendor — sits beside the search field. */
  actions?: ReactNode;
};

export function VendorFilters({ values, onChange, actions }: VendorFiltersProps) {
  const { t } = useI18n();

  return (
    <SchemaFilters
      schema={vendorListQuerySchema}
      values={values}
      names={["search"]}
      onChange={onChange}
      fieldConfig={{
        search: {
          label: t("common.actions.search"),
          placeholder: t("vendors.searchPlaceholder"),
        },
      }}
      showClear={false}
    >
      {({ fields }) => (
        <div className="flex w-full items-end gap-2">
          <div className="min-w-0 flex-1">{fields.search}</div>
          {actions ? (
            <div className="flex shrink-0 items-end gap-2">{actions}</div>
          ) : null}
        </div>
      )}
    </SchemaFilters>
  );
}
