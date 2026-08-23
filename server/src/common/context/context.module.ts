import { Global, Module } from "@nestjs/common";
import { RequestContextMiddleware } from "./middleware/request-context.middleware";

@Global()
@Module({
  providers: [RequestContextMiddleware],
  exports: [RequestContextMiddleware],
})
export class ContextModule {}
