import type { IMessageResponse } from "../../common/interface.js";

export interface IUserSettingsResponse {
  userId: string;
  settings: Record<string, unknown>;
}

export type TSaveUserSettingsResponse = IMessageResponse & {
  userId: string;
  settings: Record<string, unknown>;
};
