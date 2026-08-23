import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";

@Catch()
export class BrowserHtmlExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const isDevelopment = process.env.NODE_ENV === "development";

    const isBrowserNavigation =
      req.method === "GET" &&
      Boolean(req.headers.accept?.includes("text/html")) &&
      !(req as Request & { xhr?: boolean }).xhr;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = "Internal Server Error";
    let errorResponse: unknown = null;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse();
      if (typeof errorResponse === "string") {
        message = errorResponse;
      } else if (errorResponse && typeof errorResponse === "object") {
        const body = errorResponse as { message?: string | string[]; error?: string };
        message = body.message ?? body.error ?? "Internal Server Error";
      }
    } else if (exception instanceof Error) {
      message = isDevelopment ? exception.message : "Internal Server Error";
      stack = isDevelopment ? exception.stack : undefined;
    }

    if (isBrowserNavigation) {
      res.status(status).type("html");
      return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Error ${status}</title>
    <style>
      body { font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #f8f9fa; }
      h1 { font-size: 3em; margin-bottom: 0.5em; color: #dc3545; }
      p { color: #555; margin-bottom: 1em; }
      pre { background: #eee; padding: 1em; border-radius: 5px; text-align: left; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>Error ${status}</h1>
    <p>While requesting <code>${escapeHtml(req.url)}</code></p>
    ${
      isDevelopment
        ? `<pre>${escapeHtml(JSON.stringify(message, null, 2))}</pre>`
        : `<p>${escapeHtml(typeof message === "string" ? message : "An error occurred")}</p>`
    }
    ${stack && isDevelopment ? `<pre>${escapeHtml(stack)}</pre>` : ""}
    <p><a href="/api/docs">API Docs</a></p>
  </body>
</html>`);
    }

    const payload: Record<string, unknown> = {
      statusCode: status,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    if (
      errorResponse &&
      typeof errorResponse === "object" &&
      "error" in errorResponse
    ) {
      payload.error = (errorResponse as { error?: string }).error;
    }

    if (isDevelopment) {
      if (stack) payload.stack = stack;
      if (exception instanceof Error && exception.name) {
        payload.exceptionType = exception.name;
      }
    }

    res.status(status).json(payload);
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
