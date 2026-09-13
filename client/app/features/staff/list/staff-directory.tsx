import { type IPaginatedResponse, type IStaff } from "@moon-tailors/contracts";
import { PlusIcon } from "lucide-react";
import { Alert, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { StaffCard } from "./staff-card";
import { StaffFilters } from "./staff-filters";

export function StaffDirectory({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const createStaff = useOp(store, "createStaff");
  if (createStaff.kind !== "mutation") return null;

  const page = data as IPaginatedResponse<IStaff> | undefined;
  const rows = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("staff.loadFailed")
        : null;

  return (
    <section className="flex flex-col gap-4">
      <StaffFilters
        values={params}
        onChange={(filters) =>
          setParams({
            page: 1,
            limit: params.limit ?? 20,
            ...filters,
          })
        }
        actions={
          createStaff.allowed ? (
            <>
              <Button
                type="button"
                size="lg"
                className="size-11 px-0 lg:hidden"
                aria-label={t("staff.new")}
                onClick={() => createStaff.open()}
              >
                <PlusIcon className="size-5" />
              </Button>
              <Button
                type="button"
                size="lg"
                className="hidden shrink-0 lg:inline-flex"
                onClick={() => createStaff.open()}
              >
                {t("staff.new")}
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
        <Alert title={t("staff.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {!isPending && !errorMessage && rows.length === 0 ? (
        <p className="text-muted-foreground text-base">{t("staff.empty")}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((staff) => (
          <StaffCard key={staff.id} staff={staff} />
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
