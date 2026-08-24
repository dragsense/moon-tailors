import type { z } from "zod";
import {
  notificationSettingsSchema,
  saveUserSettingsSchema,
  themeSettingsSchema,
  timeSettingsSchema,
  userPreferencesSchema,
} from "./schema.js";

export type TSaveUserSettingsData = z.infer<typeof saveUserSettingsSchema>;
export type TThemeSettings = z.infer<typeof themeSettingsSchema>;
export type TTimeSettings = z.infer<typeof timeSettingsSchema>;
export type TNotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type TUserPreferences = z.infer<typeof userPreferencesSchema>;
