import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { Observable, map } from "rxjs";
import {
  matchesSecurityPath,
  requestPathFromUrl,
  type SecuritySkipConfig,
} from "../../config/security-skip.config";
import { SKIP_ENCRYPTION_KEY } from "../security";
import { EncryptionService } from "./encryption.service";

@Injectable()
export class ResponseEncryptionInterceptor implements NestInterceptor {
  constructor(
    private readonly encryption: EncryptionService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (!this.encryption.enabled) return data;

        const skipMeta = this.reflector.getAllAndOverride<boolean>(
          SKIP_ENCRYPTION_KEY,
          [context.getHandler(), context.getClass()],
        );
        if (skipMeta) return data;

        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();

        // Mobile clients use plain JSON (same bypass as CSRF).
        if (request.headers["x-sender"] === "mobile") {
          return data;
        }

        const url = requestPathFromUrl(request.originalUrl, request.url);
        const skip = this.config.getOrThrow<SecuritySkipConfig>("securitySkip");
        if (matchesSecurityPath(url, skip.encryptionSkipPaths)) {
          return data;
        }

        const encrypted = this.encryption.encryptResponse(data);
        response.setHeader("X-Content-Encrypted", "true");
        response.setHeader("X-Encryption-Algorithm", encrypted.algorithm);
        response.setHeader("X-Response-Timestamp", String(encrypted.timestamp));
        return encrypted;
      }),
    );
  }
}
