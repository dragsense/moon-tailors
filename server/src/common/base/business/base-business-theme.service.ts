import { Injectable, NotFoundException } from "@nestjs/common";
import {
  BUSINESS_THEME_FONT_OPTIONS,
  DEFAULT_BUSINESS_THEME,
  type TUpsertBusinessThemeData,
} from "@template/contracts";
import {
  EntityService,
  type IBoundEntityService,
} from "../../database";
import { FileUploadService } from "../../file-upload/services/file-upload.service";
import type { EntityQueryConfig } from "../../query";
import { BusinessThemeEntity } from "./entities";

export const BUSINESS_THEME_QUERY: EntityQueryConfig = {
  alias: "theme",
  sortable: ["createdAt", "updatedAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

/**
 * Theme rows are keyed by `businessId`. Shared per business — lookups use
 * `access: []` so default owner ACL is skipped (tenant filter still applies
 * when `tenantId` exists). Bind for create/update.
 */
@Injectable()
export class BaseBusinessThemeService {
  private readonly entity: IBoundEntityService<BusinessThemeEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly files: FileUploadService,
  ) {
    this.entity = this.entityService.bind(
      BusinessThemeEntity,
      BUSINESS_THEME_QUERY,
    );
  }

  findByBusinessId(
    businessId: string,
  ): Promise<BusinessThemeEntity | null> {
    return this.entity.get(
      { businessId },
      {
        access: [],
        _relations: ["logoLight", "logoDark", "favicon"],
      },
    );
  }

  async ensureDefault(businessId: string): Promise<BusinessThemeEntity> {
    const existing = await this.findByBusinessId(businessId);
    if (existing) return existing;

    const font =
      BUSINESS_THEME_FONT_OPTIONS.find(
        (f) => f.family === DEFAULT_BUSINESS_THEME.fontFamily,
      ) ?? BUSINESS_THEME_FONT_OPTIONS[0];

    return this.entity.create({
      businessId,
      primaryColorLight: DEFAULT_BUSINESS_THEME.primaryColorLight,
      primaryColorDark: DEFAULT_BUSINESS_THEME.primaryColorDark,
      secondaryColorLight: DEFAULT_BUSINESS_THEME.secondaryColorLight,
      secondaryColorDark: DEFAULT_BUSINESS_THEME.secondaryColorDark,
      accentColorLight: DEFAULT_BUSINESS_THEME.accentColorLight,
      accentColorDark: DEFAULT_BUSINESS_THEME.accentColorDark,
      borderRadius: DEFAULT_BUSINESS_THEME.borderRadius,
      fontFamily: DEFAULT_BUSINESS_THEME.fontFamily,
      fontUrl: font.url,
      title: DEFAULT_BUSINESS_THEME.title,
      loginTagline: DEFAULT_BUSINESS_THEME.loginTagline,
      density: DEFAULT_BUSINESS_THEME.density,
      sidebarStyle: DEFAULT_BUSINESS_THEME.sidebarStyle,
      logoLightId: null,
      logoDarkId: null,
      faviconId: null,
    });
  }

  async getForBusiness(businessId: string): Promise<BusinessThemeEntity> {
    const row = await this.ensureDefault(businessId);
    const refreshed = await this.findByBusinessId(row.businessId);
    if (!refreshed) throw new NotFoundException("Business theme not found");
    return refreshed;
  }

  async upsert(
    businessId: string,
    input: TUpsertBusinessThemeData,
    files?: {
      logoLight?: Express.Multer.File[];
      logoDark?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
    },
  ): Promise<BusinessThemeEntity> {
    const row = await this.ensureDefault(businessId);

    const patch: Partial<BusinessThemeEntity> = {};

    if (input.primaryColorLight !== undefined) {
      patch.primaryColorLight = input.primaryColorLight;
    }
    if (input.primaryColorDark !== undefined) {
      patch.primaryColorDark = input.primaryColorDark;
    }
    if (input.secondaryColorLight !== undefined) {
      patch.secondaryColorLight = input.secondaryColorLight;
    }
    if (input.secondaryColorDark !== undefined) {
      patch.secondaryColorDark = input.secondaryColorDark;
    }
    if (input.accentColorLight !== undefined) {
      patch.accentColorLight = input.accentColorLight;
    }
    if (input.accentColorDark !== undefined) {
      patch.accentColorDark = input.accentColorDark;
    }
    if (input.borderRadius !== undefined) {
      patch.borderRadius = input.borderRadius;
    }
    if (input.density !== undefined) {
      patch.density = input.density;
    }
    if (input.sidebarStyle !== undefined) {
      patch.sidebarStyle = input.sidebarStyle;
    }
    if (input.title !== undefined) {
      patch.title = input.title;
    }
    if (input.loginTagline !== undefined) {
      patch.loginTagline = input.loginTagline;
    }
    if (input.fontFamily !== undefined) {
      patch.fontFamily = input.fontFamily;
      if (input.fontUrl !== undefined) {
        patch.fontUrl = input.fontUrl;
      } else if (input.fontFamily) {
        const match = BUSINESS_THEME_FONT_OPTIONS.find(
          (f) => f.family === input.fontFamily,
        );
        patch.fontUrl = match?.url ?? null;
      }
    } else if (input.fontUrl !== undefined) {
      patch.fontUrl = input.fontUrl;
    }

    if (input.removeLogoLight) patch.logoLightId = null;
    if (input.removeLogoDark) patch.logoDarkId = null;
    if (input.removeFavicon) patch.faviconId = null;

    if (input.logoLightId !== undefined && !input.removeLogoLight) {
      patch.logoLightId = input.logoLightId;
    }
    if (input.logoDarkId !== undefined && !input.removeLogoDark) {
      patch.logoDarkId = input.logoDarkId;
    }
    if (input.faviconId !== undefined && !input.removeFavicon) {
      patch.faviconId = input.faviconId;
    }

    if (files?.logoLight?.[0]) {
      const uploaded = await this.files.createFile(
        { folder: "themes", name: files.logoLight[0].originalname },
        files.logoLight[0],
      );
      patch.logoLightId = uploaded.id;
    }
    if (files?.logoDark?.[0]) {
      const uploaded = await this.files.createFile(
        { folder: "themes", name: files.logoDark[0].originalname },
        files.logoDark[0],
      );
      patch.logoDarkId = uploaded.id;
    }
    if (files?.favicon?.[0]) {
      const uploaded = await this.files.createFile(
        { folder: "themes", name: files.favicon[0].originalname },
        files.favicon[0],
      );
      patch.faviconId = uploaded.id;
    }

    // Update via repository — avoid default owner ACL on shared theme rows.
    Object.assign(row, patch);
    await this.entity.getRepository().save(row);

    const refreshed = await this.findByBusinessId(businessId);
    if (!refreshed) throw new NotFoundException("Business theme not found");
    return refreshed;
  }
}
