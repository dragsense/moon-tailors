import { SetMetadata } from "@nestjs/common";

export const CACHE_KEY_METADATA = "cache_key";
export const CACHE_TTL_METADATA = "cache_ttl";
export const CACHE_PREFIX_METADATA = "cache_prefix";
export const CACHE_EVICT_METADATA = "cache_evict";

/**
 * Cache handler response. Key may include `{param}`, `{id}`, `{userId}` templates.
 *
 * @example
 * @UseInterceptors(CacheInterceptor)
 * @Cacheable("users:{id}", 60)
 * get(@Param("id") id: string) { … }
 */
export const Cacheable = (key: string, ttl?: number, prefix?: string) => {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_KEY_METADATA, key)(_target, _propertyKey, descriptor);
    if (ttl !== undefined) {
      SetMetadata(CACHE_TTL_METADATA, ttl)(_target, _propertyKey, descriptor);
    }
    if (prefix) {
      SetMetadata(CACHE_PREFIX_METADATA, prefix)(
        _target,
        _propertyKey,
        descriptor,
      );
    }
    return descriptor;
  };
};

/** Clear cache keys after the handler succeeds. */
export const CacheEvict = (keys: string | string[], prefix?: string) => {
  return (
    _target: object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ) => {
    SetMetadata(CACHE_EVICT_METADATA, { keys, prefix })(
      _target,
      _propertyKey,
      descriptor,
    );
    return descriptor;
  };
};
