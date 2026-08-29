import type { TCustomerListQuery } from "@moon-tailors/contracts";
import { customerListQuerySchema } from "@moon-tailors/contracts";
import type { ReactNode } from "react";
import { SchemaFilters } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";

type CustomerFiltersProps = {
  values: Partial<TCustomerListQuery>;
  onChange: (filters: Partial<TCustomerListQuery>) => void;
  /** e.g. Create customer — sits beside the search field. */
  actions?: ReactNode;
};

export function CustomerFilters({
  values,
  onChange,
  actions,
}: CustomerFiltersProps) {
  const { t } = useI18n();

  return (
    <SchemaFilters
      schema={customerListQuerySchema}
      values={values}
      names={["search"]}
      onChange={onChange}
      fieldConfig={{
        search: {
          label: t("common.actions.search"),
          placeholder: t("customers.searchPlaceholder"),
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
