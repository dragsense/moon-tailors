import type {
  IBusinessTheme,
  TUpsertBusinessThemeData,
} from "@template/contracts";
import { BaseService } from "~/lib/api";

class BusinessThemeService extends BaseService<
  IBusinessTheme,
  TUpsertBusinessThemeData,
  TUpsertBusinessThemeData
> {
  constructor() {
    super("/business-theme");
  }

  getCurrent() {
    return this.getSingle<IBusinessTheme>(undefined, undefined, "/current");
  }

  getMyTheme() {
    return this.getSingle<IBusinessTheme>(undefined, undefined, "/my-theme");
  }

  upsert(
    data: TUpsertBusinessThemeData,
    files?: {
      logoLight?: File | null;
      logoDark?: File | null;
      favicon?: File | null;
    },
  ) {
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;
      payload[key] = value === null ? "" : value;
    }
    if (files?.logoLight) payload.logoLight = files.logoLight;
    if (files?.logoDark) payload.logoDark = files.logoDark;
    if (files?.favicon) payload.favicon = files.favicon;
    return this.putFormData<IBusinessTheme>()(payload);
  }
}

export const businessThemeService = new BusinessThemeService();
