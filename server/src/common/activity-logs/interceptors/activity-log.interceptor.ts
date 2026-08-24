import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import type { Request, Response } from "express";
import { EActivityStatus, EActivityType } from "@moon-tailors/contracts";
import { ActivityLogsService } from "../activity-logs.service";
import { ActivityLogRegistry } from "../activity-log.registry";

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly activityLogs: ActivityLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const url = request.originalUrl || request.url;
    const method = request.method;

    if (url.includes("/activity-logs")) {
      return next.handle();
    }

    if (!this.activityLogs.shouldLog(url, method)) {
      return next.handle();
    }

    const start = Date.now();
    const activityType = this.activityType(method);
    const description = this.description(method, url);
    const moduleName =
      ActivityLogRegistry.list().find((r) =>
        r.endpoints.some((p) => url.includes(p)),
      )?.module ?? null;

    return next.handle().pipe(
      tap(() => {
        void this.activityLogs
          .createActivityLog({
            description,
            type: activityType,
            status: EActivityStatus.SUCCESS,
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
            endpoint: url,
            method,
            statusCode: response.statusCode,
            module: moduleName ?? undefined,
            metadata: {
              durationMs: Date.now() - start,
              bodyKeys: this.bodyKeys(request.body),
            },
          })
          .catch(() => undefined);
      }),
      catchError((error: Error & { status?: number }) => {
        void this.activityLogs
          .createActivityLog({
            description,
            type: activityType,
            status: EActivityStatus.FAILED,
            ipAddress: request.ip,
            userAgent: request.headers["user-agent"],
            endpoint: url,
            method,
            statusCode: error.status ?? 500,
            module: moduleName ?? undefined,
            errorMessage: error.message,
            metadata: {
              durationMs: Date.now() - start,
              bodyKeys: this.bodyKeys(request.body),
            },
          })
          .catch(() => undefined);
        return throwError(() => error);
      }),
    );
  }

  private activityType(method: string): EActivityType {
    switch (method.toUpperCase()) {
      case "POST":
        return EActivityType.CREATE;
      case "PUT":
      case "PATCH":
        return EActivityType.UPDATE;
      case "DELETE":
        return EActivityType.DELETE;
      case "GET":
        return EActivityType.READ;
      default:
        return EActivityType.ACTION;
    }
  }

  private description(method: string, url: string): string {
    const segment = url.split("?")[0]?.split("/").filter(Boolean).pop() ?? "resource";
    const verbs: Record<string, string> = {
      GET: "Retrieved",
      POST: "Created",
      PUT: "Updated",
      PATCH: "Modified",
      DELETE: "Deleted",
    };
    return `${verbs[method.toUpperCase()] ?? "Accessed"} ${segment}`;
  }

  private bodyKeys(body: unknown, prefix = ""): string[] {
    if (!body || typeof body !== "object" || Array.isArray(body)) return [];
    const keys: string[] = [];
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      const full = prefix ? `${prefix}.${key}` : key;
      keys.push(full);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        keys.push(...this.bodyKeys(value, full));
      }
    }
    return keys;
  }
}
