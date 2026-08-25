import type { z } from "zod";
import {
  saveUserSettingsSchema,
  userPreferencesSchema,
} from "./schema.js";

export type TSaveUserSettingsData = z.infer<typeof saveUserSettingsSchema>;
export type TUserPreferences = z.infer<typeof userPreferencesSchema>;
