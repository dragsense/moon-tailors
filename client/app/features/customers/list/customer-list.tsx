import { useState } from "react";
import type { ICustomer, IPaginatedResponse } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { Alert, CardRow, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath } from "~/config/routes.config";

export function CustomerList({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
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
    <Page
      title={t("customers.title")}
      description={t("customers.description")}
      actions={
        createCustomer.allowed ? (
          <Button type="button" size="lg" onClick={() => createCustomer.open()}>
            {t("customers.new")}
          </Button>
        ) : null
      }
    >
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
      </form>

      {isPending ? (
        <p className="text-muted-foreground text-base">{t("common.actions.loading")}</p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("customers.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      <List
        items={rows}
        getItemKey={(row: ICustomer) => row.id}
        empty={
          !isPending && !errorMessage ? (
            <p className="text-muted-foreground text-base">{t("customers.empty")}</p>
          ) : null
        }
        renderItem={(customer: ICustomer) => (
          <CardRow
            title={customer.name}
            actions={
              <Button asChild size="lg" variant="outline">
                <Link to={customerPath(customer.id)}>{t("common.actions.open")}</Link>
              </Button>
            }
          >
            <p className="text-muted-foreground text-base">
              {customer.phone}
              {customer.whatsapp ? ` · ${customer.whatsapp}` : ""}
            </p>
          </CardRow>
        )}
      />

      {page ? (
        <ListPagination
          meta={page}
          pageItemCount={rows.length}
          isLoading={isPending}
          mode="bar"
          onPageChange={(pageNumber) => setParams({ ...params, page: pageNumber })}
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </Page>
  );
}
