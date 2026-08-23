import type { z } from "zod";
import type { IMessageResponse } from "../../common/interface.js";
import { settingRowSchema, userPreferencesSchema } from "./schema.js";

export interface ISettingRow extends z.infer<typeof settingRowSchema> {}

export interface IEntitySettingsResponse {
  entityId: string;
  settings: Record<string, unknown>;
}

export type TSaveEntitySettingsResponse = IMessageResponse & {
  entityId: string;
  settings: Record<string, unknown>;
};

export type TDeleteEntitySettingResponse = IMessageResponse & {
  entityId: string;
  key: string;
};

export type IUserPreferences = z.infer<typeof userPreferencesSchema>;
