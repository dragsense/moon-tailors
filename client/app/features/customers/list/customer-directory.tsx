import type { ICustomer, IPaginatedResponse } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath } from "~/config/routes.config";
import { CustomerAvatar } from "../components/customer-avatar";
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
          createCustomer.allowed ? (
            <Button
              type="button"
              size="lg"
              className="shrink-0"
              onClick={() => createCustomer.open()}
            >
              {t("customers.new")}
            </Button>
          ) : null
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((customer) => (
          <Link
            key={customer.id}
            to={customerPath(customer.id)}
            className="rounded-2xl border border-border/70 bg-card p-5 transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-4">
              <CustomerAvatar
                customer={customer}
                className="size-16 text-base"
              />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{customer.name}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {customer.phone}
                </p>
                {customer.alternative ? (
                  <p className="text-muted-foreground truncate text-sm">
                    {customer.alternative}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>
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
