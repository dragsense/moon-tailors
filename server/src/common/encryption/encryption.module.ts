import { Global, Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EncryptionService } from "./encryption.service";
import { ResponseEncryptionInterceptor } from "./response-encryption.interceptor";

@Global()
@Module({
  providers: [
    EncryptionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEncryptionInterceptor,
    },
  ],
  exports: [EncryptionService],
})
export class EncryptionModule {}
