import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import { EUserLevel } from "@moon-tailors/contracts";
import { Public, RequireUserLevels } from "../auth";
import type { CacheConfig } from "../../config";
import { CacheService } from "./services";

@ApiTags("Cache")
@Controller("cache")
export class CacheController {
  constructor(
    private readonly cache: CacheService,
    private readonly config: ConfigService,
  ) {}

  @Get("status")
  @Public()
  status() {
    const cfg = this.config.getOrThrow<CacheConfig>("cache");
    return {
      enabled: cfg.enabled,
      operational: this.cache.isOperational(),
      prefix: cfg.prefix,
      defaultTtl: cfg.defaultTtl,
      redis: {
        host: cfg.redis.host,
        port: cfg.redis.port,
        db: cfg.redis.db,
      },
    };
  }

  @Get("ping")
  @RequireUserLevels(
    EUserLevel.PLATFORM_OWNER,
    EUserLevel.SUPER_ADMIN,
    EUserLevel.ADMIN,
  )
  async ping() {
    const key = `health:${Date.now()}`;
    await this.cache.set(key, { ok: true }, { ttl: 10 });
    const value = await this.cache.get<{ ok: boolean }>(key);
    await this.cache.del(key);
    return {
      operational: this.cache.isOperational(),
      roundTrip: value?.ok === true,
    };
  }
}
