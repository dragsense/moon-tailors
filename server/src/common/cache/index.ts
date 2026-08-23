/**
 * Redis cache module.
 *
 * ```txt
 * cache/
 *   types/           CacheOptions, metadata shapes
 *   interfaces/      ICacheService
 *   decorators/      @Cacheable, @CacheEvict
 *   interceptors/    CacheInterceptor
 *   services/        CacheService
 *   cache.controller.ts
 *   cache.module.ts
 * ```
 */
export { CacheModule } from "./cache.module";
export { CacheService } from "./services";
export { CacheInterceptor } from "./interceptors";
export { Cacheable, CacheEvict } from "./decorators";
export type {
  CacheOptions,
  CacheEvictMetadata,
  CacheHttpRequest,
} from "./types";
export type { ICacheService } from "./interfaces";
