import { useSyncExternalStore, type ReactNode } from "react";
import {
  EDensity,
  ESidebarStyle,
  type IBusinessTheme,
} from "@template/contracts";
import { useTheme } from "~/hooks/use-theme";
import { useOp } from "~/ops";
import { BusinessThemeProvider as Provider } from "../context";
import {
  getPreviewDraft,
  subscribePreviewDraft,
} from "../lib/draft-store";
import { isPreviewMode } from "../lib/preview";
import { businessThemeOps } from "../ops";
import { BusinessThemeApply } from "./business-theme-apply";

export function BusinessThemeRoot({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const currentTheme = useOp(businessThemeOps, "currentTheme");
  const preview = isPreviewMode();
  const draft = useSyncExternalStore(
    subscribePreviewDraft,
    getPreviewDraft,
    () => null,
  );

  const saved: IBusinessTheme | null =
    currentTheme.kind === "query"
      ? ((currentTheme.data as IBusinessTheme | undefined) ?? null)
      : null;

  const appearance =
    preview && draft?.previewAppearance
      ? draft.previewAppearance
      : resolvedTheme;

  const title = (preview ? draft?.title : saved?.title) ?? null;
  const loginTagline =
    (preview ? draft?.loginTagline : saved?.loginTagline) ?? null;
  const density =
    (preview ? (draft?.density as IBusinessTheme["density"]) : saved?.density) ??
    null;
  const sidebarStyle =
    (preview
      ? (draft?.sidebarStyle as IBusinessTheme["sidebarStyle"])
      : saved?.sidebarStyle) ?? null;

  const logoUrl =
    appearance === "dark"
      ? (preview
          ? (draft?.logoDarkUrl ?? draft?.logoLightUrl)
          : (saved?.logoDark?.url ?? saved?.logoLight?.url)) ?? null
      : (preview
          ? (draft?.logoLightUrl ?? draft?.logoDarkUrl)
          : (saved?.logoLight?.url ?? saved?.logoDark?.url)) ?? null;

  return (
    <Provider
      value={{
        theme: saved,
        title,
        loginTagline,
        logoUrl,
        sidebarStyle: sidebarStyle ?? ESidebarStyle.ICON,
        density: density ?? EDensity.COMFORTABLE,
      }}
    >
      <BusinessThemeApply />
      {children}
    </Provider>
  );
}
