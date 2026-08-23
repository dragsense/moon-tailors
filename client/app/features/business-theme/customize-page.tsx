import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import {
  BUSINESS_THEME_FONT_OPTIONS,
  DEFAULT_BUSINESS_THEME,
  EBorderRadius,
  EDensity,
  ESidebarStyle,
  type IBusinessTheme,
  type TUpsertBusinessThemeData,
} from "@template/contracts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
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
import { APP_ROUTES } from "~/config";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { useOp } from "~/ops";
import { CustomizationPreview } from "./components/customization-preview";
import { isPreviewMode, type BusinessThemeDraftPayload } from "./lib/preview";
import { businessThemeOps } from "./ops";

type DraftState = {
  primaryColorLight: string;
  primaryColorDark: string;
  secondaryColorLight: string;
  secondaryColorDark: string;
  accentColorLight: string;
  accentColorDark: string;
  borderRadius: EBorderRadius;
  fontFamily: string;
  fontUrl: string;
  title: string;
  loginTagline: string;
  density: EDensity;
  sidebarStyle: ESidebarStyle;
  logoLightFile: File | null;
  logoDarkFile: File | null;
  faviconFile: File | null;
  logoLightUrl: string | null;
  logoDarkUrl: string | null;
  faviconUrl: string | null;
  removeLogoLight: boolean;
  removeLogoDark: boolean;
  removeFavicon: boolean;
  previewAppearance: "light" | "dark";
  previewPath: string;
};

function themeToDraft(theme: IBusinessTheme | null | undefined): DraftState {
  const fontFamily =
    theme?.fontFamily ?? DEFAULT_BUSINESS_THEME.fontFamily ?? "Inter";
  const fontOption = BUSINESS_THEME_FONT_OPTIONS.find(
    (f) => f.family === fontFamily,
  );
  return {
    primaryColorLight:
      theme?.primaryColorLight ?? DEFAULT_BUSINESS_THEME.primaryColorLight,
    primaryColorDark:
      theme?.primaryColorDark ?? DEFAULT_BUSINESS_THEME.primaryColorDark,
    secondaryColorLight:
      theme?.secondaryColorLight ?? DEFAULT_BUSINESS_THEME.secondaryColorLight,
    secondaryColorDark:
      theme?.secondaryColorDark ?? DEFAULT_BUSINESS_THEME.secondaryColorDark,
    accentColorLight:
      theme?.accentColorLight ?? DEFAULT_BUSINESS_THEME.accentColorLight,
    accentColorDark:
      theme?.accentColorDark ?? DEFAULT_BUSINESS_THEME.accentColorDark,
    borderRadius: theme?.borderRadius ?? DEFAULT_BUSINESS_THEME.borderRadius,
    fontFamily,
    fontUrl: theme?.fontUrl ?? fontOption?.url ?? "",
    title: theme?.title ?? DEFAULT_BUSINESS_THEME.title ?? "",
    loginTagline:
      theme?.loginTagline ?? DEFAULT_BUSINESS_THEME.loginTagline ?? "",
    density: theme?.density ?? DEFAULT_BUSINESS_THEME.density,
    sidebarStyle: theme?.sidebarStyle ?? DEFAULT_BUSINESS_THEME.sidebarStyle,
    logoLightFile: null,
    logoDarkFile: null,
    faviconFile: null,
    logoLightUrl: theme?.logoLight?.url ?? null,
    logoDarkUrl: theme?.logoDark?.url ?? null,
    faviconUrl: theme?.favicon?.url ?? null,
    removeLogoLight: false,
    removeLogoDark: false,
    removeFavicon: false,
    previewAppearance: "light",
    previewPath: APP_ROUTES.DASHBOARD,
  };
}

export function CustomizePage() {
  const { t } = useI18n();
  const myTheme = useOp(businessThemeOps, "myTheme");
  const saveTheme = useOp(businessThemeOps, "saveTheme");
  const [draft, setDraft] = useState<DraftState>(() => themeToDraft(null));
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const inPreview = isPreviewMode();

  useEffect(() => {
    if (inPreview) return;
    if (myTheme.kind !== "query") return;
    if (!myTheme.data && myTheme.isPending) return;
    if (!hydrated) {
      setDraft(themeToDraft(myTheme.data as IBusinessTheme | undefined));
      setHydrated(true);
    }
  }, [myTheme, hydrated, inPreview]);

  useEffect(() => {
    if (!savedFlash) return;
    const id = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(id);
  }, [savedFlash]);

  const previewPayload: BusinessThemeDraftPayload = useMemo(
    () => ({
      primaryColorLight: draft.primaryColorLight,
      primaryColorDark: draft.primaryColorDark,
      secondaryColorLight: draft.secondaryColorLight,
      secondaryColorDark: draft.secondaryColorDark,
      accentColorLight: draft.accentColorLight,
      accentColorDark: draft.accentColorDark,
      borderRadius: draft.borderRadius,
      fontFamily: draft.fontFamily,
      fontUrl: draft.fontUrl,
      title: draft.title,
      loginTagline: draft.loginTagline,
      density: draft.density,
      sidebarStyle: draft.sidebarStyle,
      logoLightUrl: draft.removeLogoLight ? null : draft.logoLightUrl,
      logoDarkUrl: draft.removeLogoDark ? null : draft.logoDarkUrl,
      faviconUrl: draft.removeFavicon ? null : draft.faviconUrl,
      previewAppearance: draft.previewAppearance,
    }),
    [draft],
  );

  if (inPreview) {
    return <Navigate to={APP_ROUTES.DASHBOARD} replace />;
  }

  if (myTheme.kind !== "query" || saveTheme.kind !== "mutation") {
    return null;
  }

  const patch = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const onFile = (
    key: "logoLightFile" | "logoDarkFile" | "faviconFile",
    urlKey: "logoLightUrl" | "logoDarkUrl" | "faviconUrl",
    removeKey: "removeLogoLight" | "removeLogoDark" | "removeFavicon",
    file: File | null,
  ) => {
    setDraft((prev) => {
      const next = { ...prev, [key]: file, [removeKey]: false };
      if (file) {
        next[urlKey] = URL.createObjectURL(file);
      }
      return next;
    });
  };

  const save = async () => {
    setError(null);
    const data: TUpsertBusinessThemeData = {
      primaryColorLight: draft.primaryColorLight,
      primaryColorDark: draft.primaryColorDark,
      secondaryColorLight: draft.secondaryColorLight,
      secondaryColorDark: draft.secondaryColorDark,
      accentColorLight: draft.accentColorLight,
      accentColorDark: draft.accentColorDark,
      borderRadius: draft.borderRadius,
      fontFamily: draft.fontFamily,
      fontUrl: draft.fontUrl,
      title: draft.title || null,
      loginTagline: draft.loginTagline || null,
      density: draft.density,
      sidebarStyle: draft.sidebarStyle,
      removeLogoLight: draft.removeLogoLight || undefined,
      removeLogoDark: draft.removeLogoDark || undefined,
      removeFavicon: draft.removeFavicon || undefined,
    };
    try {
      await saveTheme.run({
        data,
        files: {
          logoLight: draft.logoLightFile,
          logoDark: draft.logoDarkFile,
          favicon: draft.faviconFile,
        },
      });
      setSavedFlash(true);
      setDraft((prev) => ({
        ...prev,
        logoLightFile: null,
        logoDarkFile: null,
        faviconFile: null,
        removeLogoLight: false,
        removeLogoDark: false,
        removeFavicon: false,
      }));
      await myTheme.refetch?.();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("customize.saveFailed"),
      );
    }
  };

  return (
    <Page
      title={t("customize.title")}
      description={t("customize.description")}
      className="max-w-none"
    >
      {myTheme.isPending && !hydrated ? (
        <p className="text-sm text-muted-foreground">
          {t("common.actions.loading")}
        </p>
      ) : null}

      <div className="flex min-h-[70vh] flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 space-y-4 lg:w-96 lg:overflow-y-auto lg:pr-2">
          <Tabs
            value={draft.previewAppearance}
            onValueChange={(v) =>
              patch("previewAppearance", v as "light" | "dark")
            }
          >
            <TabsList className="w-full">
              <TabsTrigger value="light" className="flex-1">
                {t("customize.tabs.light")}
              </TabsTrigger>
              <TabsTrigger value="dark" className="flex-1">
                {t("customize.tabs.dark")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="light" className="mt-4 space-y-4">
              <ColorField
                label={t("customize.fields.primary")}
                value={draft.primaryColorLight}
                onChange={(v) => patch("primaryColorLight", v)}
              />
              <ColorField
                label={t("customize.fields.secondary")}
                value={draft.secondaryColorLight}
                onChange={(v) => patch("secondaryColorLight", v)}
              />
              <ColorField
                label={t("customize.fields.accent")}
                value={draft.accentColorLight}
                onChange={(v) => patch("accentColorLight", v)}
              />
              <FileField
                label={t("customize.fields.logoLight")}
                previewUrl={
                  draft.removeLogoLight ? null : draft.logoLightUrl
                }
                onChange={(file) =>
                  onFile(
                    "logoLightFile",
                    "logoLightUrl",
                    "removeLogoLight",
                    file,
                  )
                }
                onRemove={() =>
                  setDraft((p) => ({
                    ...p,
                    logoLightFile: null,
                    logoLightUrl: null,
                    removeLogoLight: true,
                  }))
                }
              />
            </TabsContent>

            <TabsContent value="dark" className="mt-4 space-y-4">
              <ColorField
                label={t("customize.fields.primary")}
                value={draft.primaryColorDark}
                onChange={(v) => patch("primaryColorDark", v)}
              />
              <ColorField
                label={t("customize.fields.secondary")}
                value={draft.secondaryColorDark}
                onChange={(v) => patch("secondaryColorDark", v)}
              />
              <ColorField
                label={t("customize.fields.accent")}
                value={draft.accentColorDark}
                onChange={(v) => patch("accentColorDark", v)}
              />
              <FileField
                label={t("customize.fields.logoDark")}
                previewUrl={draft.removeLogoDark ? null : draft.logoDarkUrl}
                onChange={(file) =>
                  onFile(
                    "logoDarkFile",
                    "logoDarkUrl",
                    "removeLogoDark",
                    file,
                  )
                }
                onRemove={() =>
                  setDraft((p) => ({
                    ...p,
                    logoDarkFile: null,
                    logoDarkUrl: null,
                    removeLogoDark: true,
                  }))
                }
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>{t("customize.fields.title")}</Label>
              <Input
                value={draft.title}
                onChange={(e) => patch("title", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("customize.fields.loginTagline")}</Label>
              <Input
                value={draft.loginTagline}
                onChange={(e) => patch("loginTagline", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("customize.fields.font")}</Label>
              <Select
                value={draft.fontFamily}
                onValueChange={(family) => {
                  const opt = BUSINESS_THEME_FONT_OPTIONS.find(
                    (f) => f.family === family,
                  );
                  setDraft((p) => ({
                    ...p,
                    fontFamily: family,
                    fontUrl: opt?.url ?? "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_THEME_FONT_OPTIONS.map((f) => (
                    <SelectItem key={f.family} value={f.family}>
                      {f.family}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("customize.fields.radius")}</Label>
              <Select
                value={draft.borderRadius}
                onValueChange={(v) =>
                  patch("borderRadius", v as EBorderRadius)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EBorderRadius).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`customize.radius.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("customize.fields.density")}</Label>
              <Select
                value={draft.density}
                onValueChange={(v) => patch("density", v as EDensity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EDensity).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`customize.density.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("customize.fields.sidebar")}</Label>
              <Select
                value={draft.sidebarStyle}
                onValueChange={(v) =>
                  patch("sidebarStyle", v as ESidebarStyle)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ESidebarStyle).map((v) => (
                    <SelectItem key={v} value={v}>
                      {t(`customize.sidebar.${v}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <FileField
              label={t("customize.fields.favicon")}
              previewUrl={draft.removeFavicon ? null : draft.faviconUrl}
              onChange={(file) =>
                onFile("faviconFile", "faviconUrl", "removeFavicon", file)
              }
              onRemove={() =>
                setDraft((p) => ({
                  ...p,
                  faviconFile: null,
                  faviconUrl: null,
                  removeFavicon: true,
                }))
              }
            />
            <div className="space-y-2">
              <Label>{t("customize.fields.previewPath")}</Label>
              <Select
                value={draft.previewPath}
                onValueChange={(v) => patch("previewPath", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={APP_ROUTES.DASHBOARD}>
                    {t("nav.items.dashboard")}
                  </SelectItem>
                  <SelectItem value={APP_ROUTES.TASKS}>
                    {t("nav.items.tasks")}
                  </SelectItem>
                  <SelectItem value={APP_ROUTES.SETTINGS}>
                    {t("nav.items.settings")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          {savedFlash ? (
            <p className="text-sm text-muted-foreground">
              {t("customize.saved")}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void save()}
              disabled={saveTheme.isPending}
            >
              {saveTheme.isPending
                ? t("common.actions.loading")
                : t("common.actions.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDraft(
                  themeToDraft(myTheme.data as IBusinessTheme | undefined),
                );
                setError(null);
              }}
            >
              {t("common.actions.cancel")}
            </Button>
          </div>
        </div>

        <CustomizationPreview
          draft={previewPayload}
          path={draft.previewPath}
          className="min-h-[28rem]"
        />
      </div>
    </Page>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded border bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

function FileField({
  label,
  previewUrl,
  onChange,
  onRemove,
}: {
  label: string;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  onRemove: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={previewUrl}
            alt=""
            className="size-12 rounded border object-contain bg-background"
          />
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            {t("common.actions.delete")}
          </Button>
        </div>
      ) : null}
      <Input
        type="file"
        accept="image/*,.ico"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
