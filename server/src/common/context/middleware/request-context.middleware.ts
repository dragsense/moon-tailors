import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { RequestContext } from "../request-context";

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    RequestContext.run(() => {
      const incoming = req.headers["x-request-id"];
      const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
      const requestId =
        candidate && REQUEST_ID_PATTERN.test(candidate) ? candidate : randomUUID();

      RequestContext.set("requestId", requestId);
      RequestContext.set(
        "timezone",
        typeof req.headers["x-timezone"] === "string"
          ? req.headers["x-timezone"]
          : "UTC",
      );
      res.setHeader("X-Request-Id", requestId);
      next();
    });
  }
}
