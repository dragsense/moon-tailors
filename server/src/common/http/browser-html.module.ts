import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { BrowserHtmlExceptionFilter } from "./filters/browser-html.exception-filter";
import { BrowserHtmlInterceptor } from "./interceptors/browser-html.interceptor";

@Module({
  providers: [
    { provide: APP_FILTER, useClass: BrowserHtmlExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: BrowserHtmlInterceptor },
  ],
})
export class BrowserHtmlModule {}
