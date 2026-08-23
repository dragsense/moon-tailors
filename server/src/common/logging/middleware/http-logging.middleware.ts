import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { AppLoggerService } from "../services/app-logger.service";

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLoggerService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const started = performance.now();

    response.on("finish", () => {
      this.logger.http({
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: Math.round((performance.now() - started) * 100) / 100,
        ip: request.ip,
        userAgent: request.get("user-agent"),
      });
    });

    next();
  }
}
