import type { TOrderListQuery } from "@moon-tailors/contracts";
import { orderListQuerySchema } from "@moon-tailors/contracts";
import type { ReactNode } from "react";
import { SchemaFilters } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";

type OrderFiltersProps = {
  values: Partial<TOrderListQuery>;
  onChange: (filters: Partial<TOrderListQuery>) => void;
  actions?: ReactNode;
};

export function OrderFilters({
  values,
  onChange,
  actions,
}: OrderFiltersProps) {
  const { t } = useI18n();

  return (
    <SchemaFilters
      schema={orderListQuerySchema}
      values={values}
      names={["search", "status", "delayed"]}
      onChange={onChange}
      fieldConfig={{
        search: {
          label: t("common.actions.search"),
          placeholder: t("orders.searchPlaceholder"),
        },
        status: {
          label: t("orders.statusLabel"),
          placeholder: t("orders.allStatuses"),
        },
        delayed: {
          label: t("orders.delayedOnly"),
        },
      }}
      showClear={false}
    >
      {({ fields }) => (
        <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-0 flex-1">{fields.search}</div>
          <div className="w-full shrink-0 sm:w-auto sm:min-w-[10rem]">
            {fields.status}
          </div>
          <div className="flex h-10 shrink-0 items-center">{fields.delayed}</div>
          {actions}
        </div>
      )}
    </SchemaFilters>
  );
}
