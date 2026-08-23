import type { z } from "zod";
import {
  notificationSettingsSchema,
  saveEntitySettingsSchema,
  themeSettingsSchema,
  timeSettingsSchema,
  userPreferencesSchema,
} from "./schema.js";

export type TSaveEntitySettingsData = z.infer<typeof saveEntitySettingsSchema>;
export type TThemeSettings = z.infer<typeof themeSettingsSchema>;
export type TTimeSettings = z.infer<typeof timeSettingsSchema>;
export type TNotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type TUserPreferences = z.infer<typeof userPreferencesSchema>;
