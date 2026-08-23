import { useEffect, useRef } from "react";
import type { IBusinessTheme } from "@template/contracts";
import { useTheme } from "~/hooks/use-theme";
import { useOp } from "~/ops";
import { setPreviewDraft } from "../lib/draft-store";
import {
  isBusinessThemeDraftMessage,
  isPreviewMode,
} from "../lib/preview";
import {
  applyBusinessThemeToDocument,
  clearBusinessThemeCssVars,
} from "../lib/theme-css";
import { businessThemeOps } from "../ops";

/**
 * Applies the **saved** business theme to the document.
 * In `?preview=1` iframes, skips saved apply and listens for draft postMessages only.
 */
export function BusinessThemeApply() {
  const { resolvedTheme } = useTheme();
  const currentTheme = useOp(businessThemeOps, "currentTheme");
  const preview = isPreviewMode();
  const lastDraftRef = useRef<IBusinessTheme | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (preview) {
      document.documentElement.dataset.preview = "1";
    } else {
      delete document.documentElement.dataset.preview;
    }
  }, [preview]);

  // Saved theme → parent (and non-preview routes)
  useEffect(() => {
    if (preview) return;
    if (currentTheme.kind !== "query") return;
    const theme = currentTheme.data as IBusinessTheme | undefined;
    if (!theme) return;

    applyBusinessThemeToDocument(resolvedTheme === "dark", theme, {
      setTitle: true,
    });

    return () => {
      clearBusinessThemeCssVars(document.documentElement);
    };
  }, [preview, currentTheme, resolvedTheme]);

  // Draft theme → iframe only
  useEffect(() => {
    if (!preview) return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isBusinessThemeDraftMessage(event.data)) return;
      const payload = event.data.payload;
      lastDraftRef.current = payload as unknown as IBusinessTheme;
      setPreviewDraft(payload);
      applyBusinessThemeToDocument(
        payload.previewAppearance === "dark" || resolvedTheme === "dark",
        payload,
        {
          setTitle: true,
          previewAppearance: payload.previewAppearance,
        },
      );
    };

    window.addEventListener("message", onMessage);
    // Tell parent we're ready for the latest draft
    window.parent.postMessage(
      { type: "business-theme-preview-ready" },
      window.location.origin,
    );

    return () => {
      window.removeEventListener("message", onMessage);
      setPreviewDraft(null);
      clearBusinessThemeCssVars(document.documentElement);
    };
  }, [preview, resolvedTheme]);

  return null;
}
