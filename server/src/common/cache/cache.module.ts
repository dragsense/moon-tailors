import { Global, Module } from "@nestjs/common";
import { CacheController } from "./cache.controller";
import { CacheInterceptor } from "./interceptors";
import { CacheService } from "./services";

@Global()
@Module({
  providers: [CacheService, CacheInterceptor],
  controllers: [CacheController],
  exports: [CacheService, CacheInterceptor],
})
export class CacheModule {}
