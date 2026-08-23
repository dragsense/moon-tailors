import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  EResource,
  type ICreateApiKeyResponse,
  type IPaginatedResponse,
  type TApiKeyListQuery,
  type TCreateApiKeyData,
} from "@template/contracts";
import type { AuthConfig } from "../../config";
import { PermissionsService } from "../../common/base";
import {
  EntityService,
  type IBoundEntityService,
} from "../../common/database";
import type { EntityQueryConfig } from "../../common/query";
import {
  generateApiKey,
  hashAuthSecret,
} from "../auth/utils/auth-crypto";
import { ApiKeyEntity } from "./entities/api-key.entity";
import type { ResolvedApiKey } from "./types";

export const API_KEY_QUERY: EntityQueryConfig = {
  alias: "apiKey",
  restrictedFields: ["keyHash", "passwordHash"],
  searchable: ["name", "keyPrefix"],
  sortable: ["createdAt", "updatedAt", "name", "lastUsedAt", "expiresAt"],
  defaultSort: { field: "createdAt", order: "DESC" },
};

@Injectable()
export class ApiKeysService implements OnModuleInit {
  private readonly authConfig: AuthConfig;
  private readonly entity: IBoundEntityService<ApiKeyEntity>;

  constructor(
    private readonly entityService: EntityService,
    private readonly permissions: PermissionsService,
    config: ConfigService,
  ) {
    this.authConfig = config.getOrThrow<AuthConfig>("auth");
    this.entity = this.entityService.bind(ApiKeyEntity, API_KEY_QUERY);
  }

  onModuleInit() {
    void this.permissions.ensureResource(EResource.API_KEYS);
  }

  assertEnabled() {
    if (!this.authConfig.apiKeyEnabled) {
      throw new ServiceUnavailableException("API key auth is disabled");
    }
  }

  async create(
    userId: string,
    input: TCreateApiKeyData,
  ): Promise<ICreateApiKeyResponse> {
    this.assertEnabled();
    const { raw, keyPrefix } = generateApiKey(this.authConfig.apiKeyPrefix);
    const expiresAt =
      input.expiresInDays != null
        ? new Date(Date.now() + input.expiresInDays * 86_400_000)
        : null;

    const created = await this.entity.create({
      userId,
      name: input.name.trim(),
      keyPrefix,
      keyHash: hashAuthSecret(raw),
      scopes: input.scopes?.length ? input.scopes : null,
      expiresAt,
      lastUsedAt: null,
      revokedAt: null,
    });

    // Re-fetch for the response envelope (`keyHash` is select:false).
    const apiKey = await this.entity.get(created.id);

    return {
      apiKey: apiKey as unknown as ICreateApiKeyResponse["apiKey"],
      key: raw,
      message:
        "API key created. Store the secret now — it will not be shown again.",
    };
  }

  listForUser(
    userId: string,
    query: TApiKeyListQuery,
  ): Promise<IPaginatedResponse<ApiKeyEntity>> {
    this.assertEnabled();
    return this.entity.list(query, {
      access: { type: "eq", column: "userId", value: userId },
      beforeQuery: (qb) => {
        qb.andWhere("apiKey.revokedAt IS NULL");
      },
    });
  }

  async revoke(userId: string, id: string): Promise<{ message: string }> {
    this.assertEnabled();
    const row = await this.entity.get(id, {
      access: { type: "eq", column: "userId", value: userId },
    });
    if (!row || row.revokedAt) throw new NotFoundException("API key not found");
    await this.entity.update(id, { revokedAt: new Date() });
    return { message: "API key revoked" };
  }

  /** Resolve a raw secret to an active key (used by AuthGuard). */
  async resolveRawKey(raw: string): Promise<ResolvedApiKey | null> {
    if (!this.authConfig.apiKeyEnabled) return null;
    const keyHash = hashAuthSecret(raw);
    // `keyHash` is select:false + restricted — lookup via QB, then load user.
    const entity = await this.entity
      .getRepository()
      .createQueryBuilder("apiKey")
      .addSelect("apiKey.keyHash")
      .leftJoinAndSelect("apiKey.user", "user")
      .where("apiKey.keyHash = :keyHash", { keyHash })
      .getOne();
    if (!entity || !entity.isValid()) return null;

    await this.entity.update(entity.id, { lastUsedAt: new Date() });

    return {
      entity,
      userId: entity.userId,
      scopes: entity.scopes,
    };
  }
}
