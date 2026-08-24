import { useEffect, useState } from "react";
import {
  EDateFormat,
  ELanguage,
  ETheme,
  ETimeFormat,
  type TUserPreferences,
} from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { LOCALE_CATALOG } from "~/locales";
import { useOp } from "~/ops";
import { formatDateTimeWithSettings } from "./lib/format";
import { resolvePreferences } from "./lib/preferences";
import { settingsOps } from "./ops";

export function UserSettingsPage() {
  const { t, intlLocale } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const saveSettings = useOp(settingsOps, "saveSettings");
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const preferences = resolvePreferences(
    mySettings.kind === "query" ? mySettings.data : undefined,
  );

  useEffect(() => {
    if (!savedFlash) return;
    const id = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [savedFlash]);

  if (mySettings.kind !== "query" || saveSettings.kind !== "mutation") {
    return null;
  }

  const save = async (patch: Partial<TUserPreferences>) => {
    setError(null);
    try {
      await saveSettings.run(patch);
      setSavedFlash(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.saveFailed"));
    }
  };

  return (
    <Page title={t("settings.title")} description={t("settings.description")}>
      {mySettings.isPending ? (
        <p className="text-sm text-muted-foreground">
          {t("common.actions.loading")}
        </p>
      ) : null}

      <Tabs defaultValue="appearance" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="appearance">
            {t("settings.tabs.appearance")}
          </TabsTrigger>
          <TabsTrigger value="time">{t("settings.tabs.time")}</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6 space-y-6">
          <Field
            label={t("settings.appearance.theme")}
            hint={t("settings.appearance.themeHint")}
          >
            <Select
              value={preferences.theme.theme}
              onValueChange={(value) => {
                if (
                  value === ETheme.LIGHT ||
                  value === ETheme.DARK ||
                  value === ETheme.SYSTEM
                ) {
                  void save({ theme: { theme: value } });
                }
              }}
              disabled={saveSettings.isPending}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ETheme.LIGHT}>
                  {t("settings.appearance.themeOptions.light")}
                </SelectItem>
                <SelectItem value={ETheme.DARK}>
                  {t("settings.appearance.themeOptions.dark")}
                </SelectItem>
                <SelectItem value={ETheme.SYSTEM}>
                  {t("settings.appearance.themeOptions.system")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field
            label={t("settings.appearance.language")}
            hint={t("settings.appearance.languageHint")}
          >
            <Select
              value={preferences.language}
              onValueChange={(value) => {
                if (value === ELanguage.EN || value === ELanguage.UR) {
                  void save({ language: value });
                }
              }}
              disabled={saveSettings.isPending}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" align="start">
                <SelectItem value={ELanguage.EN}>
                  {LOCALE_CATALOG[ELanguage.EN].nativeLabel}
                </SelectItem>
                <SelectItem value={ELanguage.UR}>
                  {LOCALE_CATALOG[ELanguage.UR].nativeLabel}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </TabsContent>

        <TabsContent value="time" className="mt-6 space-y-6">
          <Field label={t("settings.time.dateFormat")}>
            <Select
              value={preferences.time.dateFormat}
              onValueChange={(value) => {
                if (Object.values(EDateFormat).includes(value as EDateFormat)) {
                  void save({
                    time: {
                      ...preferences.time,
                      dateFormat: value as EDateFormat,
                    },
                  });
                }
              }}
              disabled={saveSettings.isPending}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(EDateFormat).map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label={t("settings.time.timeFormat")}>
            <Select
              value={preferences.time.timeFormat}
              onValueChange={(value) => {
                if (
                  value === ETimeFormat.TWELVE_HOUR ||
                  value === ETimeFormat.TWENTY_FOUR_HOUR
                ) {
                  void save({
                    time: { ...preferences.time, timeFormat: value },
                  });
                }
              }}
              disabled={saveSettings.isPending}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ETimeFormat.TWELVE_HOUR}>
                  {t("settings.time.timeOptions.12h")}
                </SelectItem>
                <SelectItem value={ETimeFormat.TWENTY_FOUR_HOUR}>
                  {t("settings.time.timeOptions.24h")}
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
            <p className="text-xs text-muted-foreground">
              {t("settings.time.preview")}
            </p>
            <p className="mt-1 font-medium">
              {formatDateTimeWithSettings(
                new Date(),
                mySettings.data,
                intlLocale,
              )}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {savedFlash ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("settings.saved")}</p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}

      {saveSettings.isPending ? (
        <Button type="button" variant="ghost" size="sm" className="mt-2" disabled>
          {t("common.actions.loading")}
        </Button>
      ) : null}
    </Page>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}
