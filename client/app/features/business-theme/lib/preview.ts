/** Query flag for customize iframe — draft-only, no parent shell mutation. */
export const PREVIEW_QUERY = "preview";
export const PREVIEW_VALUE = "1";

export const BUSINESS_THEME_DRAFT_MESSAGE = "business-theme-draft" as const;

export type BusinessThemeDraftPayload = {
  primaryColorLight?: string | null;
  primaryColorDark?: string | null;
  secondaryColorLight?: string | null;
  secondaryColorDark?: string | null;
  accentColorLight?: string | null;
  accentColorDark?: string | null;
  borderRadius?: string;
  fontFamily?: string | null;
  fontUrl?: string | null;
  title?: string | null;
  loginTagline?: string | null;
  density?: string;
  sidebarStyle?: string;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  faviconUrl?: string | null;
  /** Force light/dark class inside iframe for Light/Dark tab preview. */
  previewAppearance?: "light" | "dark";
};

export type BusinessThemeDraftMessage = {
  type: typeof BUSINESS_THEME_DRAFT_MESSAGE;
  payload: BusinessThemeDraftPayload;
};

export function isPreviewMode(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get(PREVIEW_QUERY) === PREVIEW_VALUE;
}

export function withPreviewQuery(path: string): string {
  const url = new URL(path, window.location.origin);
  url.searchParams.set(PREVIEW_QUERY, PREVIEW_VALUE);
  return `${url.pathname}${url.search}`;
}

export function isBusinessThemeDraftMessage(
  data: unknown,
): data is BusinessThemeDraftMessage {
  if (!data || typeof data !== "object") return false;
  const msg = data as Partial<BusinessThemeDraftMessage>;
  return msg.type === BUSINESS_THEME_DRAFT_MESSAGE && !!msg.payload;
}
