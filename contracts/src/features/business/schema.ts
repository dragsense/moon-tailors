import { z } from "zod";
import { listQuerySchema } from "../../common/schema.js";
import { field } from "../../lib/field-meta.js";
import { EBorderRadius, EDensity, ESidebarStyle } from "./enum.js";

const hexColor = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Must be a valid hex color");

/** GET /businesses query */
export const businessListQuerySchema = listQuerySchema.extend({
  isActive: field(
    z.preprocess(
      (v) => (v === "" || v === "__any__" ? undefined : v),
      z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .optional(),
    ),
    {
      type: "select",
      label: "Active",
      placeholder: "Any",
      order: 2,
      filter: "eq",
      options: [
        { label: "Any", value: "__any__" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ),
});

export const businessSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  subdomain: z.string().min(1).max(100).nullable().optional(),
  tenantId: z.string().uuid(),
  ownerUserId: z.string().uuid().nullable().optional(),
  paymentProcessorId: z.string().uuid().nullable().optional(),
  aiProcessorId: z.string().uuid().nullable().optional(),
  /** Exactly one platform business may be true — seeded root for single-tenant. */
  isPlatform: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createBusinessSchema = z.object({
  name: z.string().min(1).max(255),
  subdomain: z.string().min(1).max(100).optional(),
});

/** Nested file summary returned with theme (logos / favicon). */
export const businessThemeFileSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  name: z.string().optional(),
});

export const businessThemeSchema = z.object({
  id: z.string().uuid(),
  businessId: z.string().uuid(),
  primaryColorLight: hexColor.nullable(),
  primaryColorDark: hexColor.nullable(),
  secondaryColorLight: hexColor.nullable(),
  secondaryColorDark: hexColor.nullable(),
  accentColorLight: hexColor.nullable(),
  accentColorDark: hexColor.nullable(),
  borderRadius: z.nativeEnum(EBorderRadius),
  fontFamily: z.string().min(1).max(100).nullable(),
  fontUrl: z.string().max(500).nullable(),
  title: z.string().min(1).max(255).nullable(),
  loginTagline: z.string().max(500).nullable(),
  density: z.nativeEnum(EDensity),
  sidebarStyle: z.nativeEnum(ESidebarStyle),
  logoLightId: z.string().uuid().nullable(),
  logoDarkId: z.string().uuid().nullable(),
  faviconId: z.string().uuid().nullable(),
  logoLight: businessThemeFileSchema.nullable().optional(),
  logoDark: businessThemeFileSchema.nullable().optional(),
  favicon: businessThemeFileSchema.nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Multipart sends "" / "true" / "false" — normalize before parse. */
function emptyToUndefined(value: unknown): unknown {
  if (value === "" || value === null) return undefined;
  return value;
}

function coerceFormBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return value;
}

export const upsertBusinessThemeSchema = z.preprocess(
  (raw) => {
    if (!raw || typeof raw !== "object") return raw;
    const input = raw as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (
        key === "removeLogoLight" ||
        key === "removeLogoDark" ||
        key === "removeFavicon"
      ) {
        next[key] = coerceFormBoolean(value);
      } else if (
        key === "logoLightId" ||
        key === "logoDarkId" ||
        key === "faviconId" ||
        key === "fontFamily" ||
        key === "fontUrl" ||
        key === "title" ||
        key === "loginTagline"
      ) {
        next[key] = value === "" ? null : emptyToUndefined(value);
      } else {
        next[key] = emptyToUndefined(value);
      }
    }
    return next;
  },
  z.object({
    primaryColorLight: hexColor.optional(),
    primaryColorDark: hexColor.optional(),
    secondaryColorLight: hexColor.optional(),
    secondaryColorDark: hexColor.optional(),
    accentColorLight: hexColor.optional(),
    accentColorDark: hexColor.optional(),
    borderRadius: z.nativeEnum(EBorderRadius).optional(),
    fontFamily: z.string().min(1).max(100).nullable().optional(),
    fontUrl: z.string().max(500).nullable().optional(),
    title: z.string().min(1).max(255).nullable().optional(),
    loginTagline: z.string().max(500).nullable().optional(),
    density: z.nativeEnum(EDensity).optional(),
    sidebarStyle: z.nativeEnum(ESidebarStyle).optional(),
    logoLightId: z.string().uuid().nullable().optional(),
    logoDarkId: z.string().uuid().nullable().optional(),
    faviconId: z.string().uuid().nullable().optional(),
    removeLogoLight: z.boolean().optional(),
    removeLogoDark: z.boolean().optional(),
    removeFavicon: z.boolean().optional(),
  }),
);

export const DEFAULT_BUSINESS_THEME = {
  primaryColorLight: "#0d9488",
  primaryColorDark: "#2dd4bf",
  secondaryColorLight: "#f4f4f5",
  secondaryColorDark: "#3f3f46",
  accentColorLight: "#f0fdfa",
  accentColorDark: "#134e4a",
  borderRadius: EBorderRadius.MD,
  fontFamily: "Inter" as string | null,
  fontUrl: null as string | null,
  title: "Moon Tailors" as string | null,
  loginTagline: "Sign in to continue" as string | null,
  density: EDensity.COMFORTABLE,
  sidebarStyle: ESidebarStyle.ICON,
  logoLightId: null as string | null,
  logoDarkId: null as string | null,
  faviconId: null as string | null,
};

/** Fonts available for business theme (Google Fonts CSS URLs). */
export const BUSINESS_THEME_FONT_OPTIONS = [
  {
    family: "Inter",
    url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  },
  {
    family: "Poppins",
    url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
  },
  {
    family: "Geist",
    url: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap",
  },
  {
    family: "Ubuntu",
    url: "https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap",
  },
  {
    family: "Roboto",
    url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap",
  },
  {
    family: "Open Sans",
    url: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap",
  },
  {
    family: "Lato",
    url: "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
  },
  {
    family: "Montserrat",
    url: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
  },
] as const;
