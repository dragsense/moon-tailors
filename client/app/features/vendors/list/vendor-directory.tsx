import { type IPaginatedResponse, type IVendor } from "@moon-tailors/contracts";
import { PlusIcon } from "lucide-react";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { VendorCard } from "./vendor-card";
import { VendorFilters } from "./vendor-filters";

export function VendorDirectory({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const createVendor = useOp(store, "createVendor");
  if (createVendor.kind !== "mutation") return null;

  const page = data as IPaginatedResponse<IVendor> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("vendors.loadFailed")
        : null;

  return (
    <section className="flex flex-col gap-4">
      <VendorFilters
        values={params}
        onChange={(filters) =>
          setParams({
            page: 1,
            limit: params.limit ?? 20,
            ...filters,
          })
        }
        actions={
          createVendor.allowed ? (
            <>
              <Button
                type="button"
                size="lg"
                className="size-11 px-0 lg:hidden"
                aria-label={t("vendors.new")}
                onClick={() => createVendor.open()}
              >
                <PlusIcon className="size-5" />
              </Button>
              <Button
                type="button"
                size="lg"
                className="hidden shrink-0 lg:inline-flex"
                onClick={() => createVendor.open()}
              >
                {t("vendors.new")}
              </Button>
            </>
          ) : null
        }
      />

      {isPending ? (
        <p className="text-muted-foreground text-base">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("vendors.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {!isPending && !errorMessage && rows.length === 0 ? (
        <p className="text-muted-foreground text-base">{t("vendors.empty")}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
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
