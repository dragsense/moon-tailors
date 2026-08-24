import { z } from "zod";
import { field } from "../../lib/field-meta.js";
import {
  EDateFormat,
  ELanguage,
  ESettingType,
  ETheme,
  ETimeFormat,
} from "./enum.js";

export const settingRowSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().min(1),
  key: z.string().min(1).max(100),
  value: z.string(),
  type: z.nativeEnum(ESettingType),
  description: z.string().nullable().optional(),
  isPublic: z.boolean().default(false),
  isEditable: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** PUT /user-settings/:userId — nested object saved as dot-keys. */
export const saveUserSettingsSchema = z.record(z.string(), z.unknown());

export const userSettingsParamsSchema = z.object({
  userId: z.string().min(1),
});

export const userSettingKeyParamsSchema = userSettingsParamsSchema.extend({
  key: z.string().min(1).max(100),
});

export const themeSettingsSchema = z.object({
  theme: field(z.nativeEnum(ETheme).default(ETheme.SYSTEM), {
    type: "select",
    label: "Theme",
    options: Object.values(ETheme).map((value) => ({ label: value, value })),
  }),
});

export const timeSettingsSchema = z.object({
  dateFormat: field(z.nativeEnum(EDateFormat).default(EDateFormat.MMM_DD_YYYY), {
    type: "select",
    label: "Date format",
    options: Object.values(EDateFormat).map((value) => ({
      label: value,
      value,
    })),
  }),
  timeFormat: field(z.nativeEnum(ETimeFormat).default(ETimeFormat.TWELVE_HOUR), {
    type: "select",
    label: "Time format",
    options: Object.values(ETimeFormat).map((value) => ({
      label: value,
      value,
    })),
  }),
});

export const notificationSettingsSchema = z.object({
  pushEnabled: field(z.boolean().default(true), {
    type: "switch",
    label: "Push notifications",
  }),
  inAppEnabled: field(z.boolean().default(true), {
    type: "switch",
    label: "In-app notifications",
  }),
  bellEnabled: field(z.boolean().default(true), {
    type: "switch",
    label: "Show notification bell",
  }),
});

/** User preferences persisted via user-settings/me. */
export const userPreferencesSchema = z.object({
  language: field(
    z.preprocess(
      (value) => (value === "ar" ? ELanguage.UR : value),
      z.nativeEnum(ELanguage).default(ELanguage.EN),
    ),
    {
      type: "select",
      label: "Language",
      options: Object.values(ELanguage).map((value) => ({
        label: value,
        value,
      })),
    },
  ),
  theme: themeSettingsSchema.default({ theme: ETheme.SYSTEM }),
  time: timeSettingsSchema.default({
    dateFormat: EDateFormat.MMM_DD_YYYY,
    timeFormat: ETimeFormat.TWELVE_HOUR,
  }),
  notifications: notificationSettingsSchema.default({
    pushEnabled: true,
    inAppEnabled: true,
    bellEnabled: true,
  }),
});

export const DEFAULT_USER_PREFERENCES: z.infer<typeof userPreferencesSchema> = {
  language: ELanguage.EN,
  theme: { theme: ETheme.SYSTEM },
  time: {
    dateFormat: EDateFormat.MMM_DD_YYYY,
    timeFormat: ETimeFormat.TWELVE_HOUR,
  },
  notifications: {
    pushEnabled: true,
    inAppEnabled: true,
    bellEnabled: true,
  },
};
