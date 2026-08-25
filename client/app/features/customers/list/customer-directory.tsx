import { useState, type ReactNode } from "react";
import type { ICustomer, IPaginatedResponse } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath } from "~/config/routes.config";
import { CustomerAvatar } from "../components/customer-avatar";

export function CustomerDirectory({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
  afterSearch,
}: QueryOpComponentProps & { afterSearch?: ReactNode }) {
  const { t } = useI18n();
  const [search, setSearch] = useState(
    typeof params.search === "string" ? params.search : "",
  );
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
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          setParams({
            ...params,
            page: 1,
            search,
          });
        }}
      >
        <Input
          className="h-11 text-base"
          placeholder={t("customers.searchPlaceholder")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" size="lg">
          {t("common.actions.search")}
        </Button>
        {createCustomer.allowed ? (
          <Button
            type="button"
            size="lg"
            onClick={() => createCustomer.open()}
          >
            {t("customers.new")}
          </Button>
        ) : null}
      </form>

      {afterSearch}

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
                {customer.whatsapp ? (
                  <p className="text-muted-foreground truncate text-sm">
                    {customer.whatsapp}
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
