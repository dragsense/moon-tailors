import type { IPaginatedResponse } from "@moon-tailors/contracts";
import {
  EGarmentAudience,
  type IGarmentType,
} from "@moon-tailors/contracts";
import { Alert, CardRow, List } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";

export function GarmentTypeList({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const createGarmentType = useOp(store, "createGarmentType");
  const updateGarmentType = useOp(store, "updateGarmentType");
  const deleteGarmentType = useOp(store, "deleteGarmentType");

  if (createGarmentType.kind !== "mutation") return null;
  if (updateGarmentType.kind !== "mutation") return null;
  if (deleteGarmentType.kind !== "mutation") return null;

  const page = data as IPaginatedResponse<IGarmentType> | undefined;
  const types = page?.data ?? [];
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("garmentTypes.loadFailed")
        : null;
  const audience =
    typeof params.audience === "string" ? params.audience : "";

  return (
    <Page
      title={t("garmentTypes.title")}
      description={t("garmentTypes.description")}
      actions={
        createGarmentType.allowed ? (
          <Button type="button" onClick={() => createGarmentType.open()}>
            {t("garmentTypes.new")}
          </Button>
        ) : null
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={audience === "" ? "default" : "outline"}
          onClick={() => setParams({ ...params, audience: undefined, page: 1 })}
        >
          {t("garmentTypes.all")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={audience === EGarmentAudience.GENTS ? "default" : "outline"}
          onClick={() =>
            setParams({ ...params, audience: EGarmentAudience.GENTS, page: 1 })
          }
        >
          {t("garmentTypes.gents")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={audience === EGarmentAudience.LADIES ? "default" : "outline"}
          onClick={() =>
            setParams({ ...params, audience: EGarmentAudience.LADIES, page: 1 })
          }
        >
          {t("garmentTypes.ladies")}
        </Button>
      </div>

      {isPending ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}

      {errorMessage ? (
        <Alert title={t("garmentTypes.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      <List
        items={types}
        getItemKey={(type: IGarmentType) => type.id}
        empty={
          !isPending && !errorMessage ? (
            <p className="text-muted-foreground text-sm">
              {t("garmentTypes.empty")}
            </p>
          ) : null
        }
        renderItem={(type: IGarmentType) => (
          <CardRow
            title={type.name}
            actions={
              <div className="flex flex-wrap gap-2">
                {updateGarmentType.allowed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateGarmentType.open(type)}
                  >
                    {t("common.actions.edit")}
                  </Button>
                ) : null}
                {deleteGarmentType.allowed && !type.isSystem ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void deleteGarmentType
                        .run({ id: type.id, name: type.name })
                        .catch(() => {});
                    }}
                  >
                    {t("common.actions.delete")}
                  </Button>
                ) : null}
              </div>
            }
          >
            <p className="text-muted-foreground text-sm">
              {type.audience === EGarmentAudience.LADIES
                ? t("garmentTypes.ladies")
                : t("garmentTypes.gents")}
              {type.isSystem
                ? ` · ${t("garmentTypes.builtIn")}`
                : ` · ${t("garmentTypes.custom")}`}
            </p>
          </CardRow>
        )}
      />
    </Page>
  );
}
