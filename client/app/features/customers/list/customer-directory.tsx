import {
  type ICustomer,
  type IPaginatedResponse,
} from "@moon-tailors/contracts";
import { PlusIcon } from "lucide-react";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { CustomerCard } from "./customer-card";
import { CustomerFilters } from "./customer-filters";

export function CustomerDirectory({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const createCustomer = useOp(store, "createCustomer");
  if (createCustomer.kind !== "mutation") return null;

  const page = data as IPaginatedResponse<ICustomer> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("customers.loadFailed")
        : null;

  return (
    <section className="flex flex-col gap-4">
      <CustomerFilters
        values={params}
        onChange={(filters) =>
          setParams({
            page: 1,
            limit: params.limit ?? 20,
            ...filters,
          })
        }
        actions={
          <>
            {createCustomer.allowed ? (
              <>
                <Button
                  type="button"
                  size="lg"
                  className="size-11 px-0 lg:hidden"
                  aria-label={t("customers.new")}
                  onClick={() => createCustomer.open()}
                >
                  <PlusIcon className="size-5" />
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="hidden shrink-0 lg:inline-flex"
                  onClick={() => createCustomer.open()}
                >
                  {t("customers.new")}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {isPending ? (
        <p className="text-muted-foreground text-base">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("customers.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {!isPending && !errorMessage && rows.length === 0 ? (
        <p className="text-muted-foreground text-base">{t("customers.empty")}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((customer) => (
          <CustomerCard key={customer.id} customer={customer} />
        ))}
      </div>

      {page ? (
        <ListPagination
          meta={page}
          pageItemCount={rows.length}
          isLoading={isPending}
          mode="bar"
          onPageChange={(pageNumber) =>
            setParams({ ...params, page: pageNumber })
          }
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </section>
  );
}
