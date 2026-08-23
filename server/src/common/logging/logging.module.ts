import { Global, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GlobalExceptionFilter } from "./filters/global-exception.filter";
import { HttpLoggingMiddleware } from "./middleware/http-logging.middleware";
import { AppLoggerService } from "./services/app-logger.service";

@Global()
@Module({
  providers: [
    AppLoggerService,
    HttpLoggingMiddleware,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: [AppLoggerService, HttpLoggingMiddleware],
})
export class LoggingModule {}
