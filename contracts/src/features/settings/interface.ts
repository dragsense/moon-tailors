import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import { settingRowSchema, userPreferencesSchema } from "./schema.js";

export interface ISettingRow extends z.infer<typeof settingRowSchema> {}

export interface IUserSettingsResponse {
  userId: string;
  settings: Record<string, unknown>;
}

export type TSaveUserSettingsResponse = IMessageResponse & {
  userId: string;
  settings: Record<string, unknown>;
};

export type TDeleteUserSettingResponse = IMessageResponse & {
  userId: string;
  key: string;
};

export type IUserPreferences = z.infer<typeof userPreferencesSchema>;
