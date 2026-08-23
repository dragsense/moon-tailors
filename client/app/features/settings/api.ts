import type {
  IEntitySettingsResponse,
  TDeleteEntitySettingResponse,
  TSaveEntitySettingsData,
  TSaveEntitySettingsResponse,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class EntitySettingsService extends BaseService<
  IEntitySettingsResponse,
  TSaveEntitySettingsData,
  TSaveEntitySettingsData
> {
  constructor() {
    super("/entity-settings");
  }

  getMine() {
    return this.getSingle<IEntitySettingsResponse>(
      undefined,
      undefined,
      "/me",
    );
  }

  saveMine(body: TSaveEntitySettingsData) {
    return this.put<TSaveEntitySettingsResponse>()(body, undefined, "/me");
  }

  getForEntity(entityId: string) {
    return this.getSingle<IEntitySettingsResponse>(entityId);
  }

  saveForEntity(entityId: string, body: TSaveEntitySettingsData) {
    return this.put<TSaveEntitySettingsResponse>(entityId)(body);
  }

  deleteKey(entityId: string, key: string) {
    return this.delete<TDeleteEntitySettingResponse>(
      key,
      undefined,
      `/${entityId}/keys`,
    );
  }
}

export const entitySettingsService = new EntitySettingsService();
