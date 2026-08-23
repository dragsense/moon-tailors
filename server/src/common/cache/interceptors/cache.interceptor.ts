import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import {
  CACHE_EVICT_METADATA,
  CACHE_KEY_METADATA,
  CACHE_PREFIX_METADATA,
  CACHE_TTL_METADATA,
} from "../decorators";
import { CacheService } from "../services";
import type { CacheEvictMetadata, CacheHttpRequest } from "../types";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cache: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const handler = context.getHandler();
    const request = context.switchToHttp().getRequest<CacheHttpRequest>();

    const evictMeta = this.reflector.get<CacheEvictMetadata>(
      CACHE_EVICT_METADATA,
      handler,
    );

    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, handler);
    if (!cacheKey && !evictMeta) {
      return next.handle();
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, handler);
    const prefix = this.reflector.get<string>(CACHE_PREFIX_METADATA, handler);

    if (cacheKey) {
      const resolvedKey = this.resolveKey(cacheKey, request);
      const cached = await this.cache.get(resolvedKey, { ttl, prefix });
      if (cached !== null) {
        return of(cached);
      }

      return next.handle().pipe(
        tap((data) => {
          if (data !== null && data !== undefined) {
            void this.cache.set(resolvedKey, data, { ttl, prefix });
          }
        }),
      );
    }

    return next.handle().pipe(
      tap(() => {
        if (!evictMeta) return;
        const keys = Array.isArray(evictMeta.keys)
          ? evictMeta.keys
          : [evictMeta.keys];
        for (const key of keys) {
          void this.cache.del(this.resolveKey(key, request), {
            prefix: evictMeta.prefix,
          });
        }
      }),
    );
  }

  private resolveKey(key: string, request: CacheHttpRequest): string {
    let resolved = key;
    const bags = [request.params, request.query, request.user];
    for (const bag of bags) {
      if (!bag) continue;
      for (const [param, value] of Object.entries(bag)) {
        resolved = resolved.replaceAll(`{${param}}`, String(value));
      }
    }
    return resolved;
  }
}
