import type { IMeasurement, TMeasurementValues } from "@moon-tailors/contracts";
import { useI18n } from "~/hooks/use-i18n";
import type { TranslationKey } from "~/locales";
import type { QueryOpComponentProps } from "~/ops";

const MEASURE_FIELDS = [
  "length",
  "shoulder",
  "sleeve",
  "chest",
  "waist",
  "hip",
  "bottom",
  "chak",
  "trouserLength",
  "paincha",
  "belt",
  "elastic",
] as const;

/** measurementOpsCore.getMeasurement component. */
export function MeasurementView({
  data,
  isPending,
  params,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const measurement = data as IMeasurement | TMeasurementValues | null | undefined;
  const garmentType =
    typeof params.garmentType === "string" ? params.garmentType : null;

  if (isPending && !measurement) {
    return (
      <p className="text-muted-foreground text-base">
        {t("common.actions.loading")}
      </p>
    );
  }

  if (!measurement && !garmentType) {
    return (
      <p className="text-muted-foreground text-base">{t("measurements.empty")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {garmentType ? (
        <div>
          <p className="text-muted-foreground text-xs">
            {t("measurements.garment")}
          </p>
          <p className="font-heading text-lg font-semibold text-foreground">
            {garmentType}
          </p>
        </div>
      ) : null}
      {measurement ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-base sm:grid-cols-3">
          {MEASURE_FIELDS.map((key) => {
            const value = measurement[key];
            if (value == null) return null;
            return (
              <div key={key}>
                <dt className="text-muted-foreground text-xs">
                  {t(`measurements.${key}` as TranslationKey)}
                </dt>
                <dd className="font-medium tabular-nums">{value}</dd>
              </div>
            );
          })}
          {"extraNotes" in measurement && measurement.extraNotes ? (
            <div className="col-span-full">
              <dt className="text-muted-foreground text-xs">
                {t("measurements.notes")}
              </dt>
              <dd>{measurement.extraNotes}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}
