import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, map } from "rxjs";
import type { Request, Response } from "express";

@Injectable()
export class BrowserHtmlInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isBrowserNavigation =
      req.method === "GET" &&
      Boolean(req.headers.accept?.includes("text/html")) &&
      !(req as Request & { xhr?: boolean }).xhr;

    if (!isBrowserNavigation) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        res.type("html");
        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Response</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; color: #333; }
      h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #007bff; }
      pre { background: #272822; color: #f8f8f2; padding: 1em; border-radius: 6px; text-align: left; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>Response from ${escapeHtml(req.url)}</h1>
    <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    <p><a href="/">Go Home</a></p>
  </body>
</html>`;
      }),
    );
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
