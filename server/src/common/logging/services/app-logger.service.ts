import { Injectable, type LoggerService } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RequestContext } from "../../context";
import type { AppConfig } from "../../../config";

type LogLevel = "debug" | "error" | "fatal" | "info" | "verbose" | "warn";
type LogMetadata = Record<string, unknown>;

@Injectable()
export class AppLoggerService implements LoggerService {
  private readonly appConfig: AppConfig;

  constructor(config: ConfigService) {
    this.appConfig = config.getOrThrow<AppConfig>("app");
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write("info", message, this.params(optionalParams));
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write("error", message, this.params(optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write("warn", message, this.params(optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      this.write("debug", message, this.params(optionalParams));
    }
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    if (process.env.NODE_ENV !== "production") {
      this.write("verbose", message, this.params(optionalParams));
    }
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write("fatal", message, this.params(optionalParams));
  }

  http(metadata: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    ip?: string;
    userAgent?: string;
  }): void {
    this.write("info", "http_request", metadata);
  }

  exception(
    metadata: {
      method: string;
      path: string;
      statusCode: number;
      exceptionType: string;
    },
    error?: Error,
  ): void {
    const level: LogLevel = metadata.statusCode >= 500 ? "error" : "warn";
    this.write(level, "http_exception", {
      ...metadata,
      errorMessage: error?.message,
      ...(metadata.statusCode >= 500 ? { stack: error?.stack } : {}),
    });
  }

  private write(
    level: LogLevel,
    message: unknown,
    metadata: LogMetadata = {},
  ): void {
    const record = {
      timestamp: new Date().toISOString(),
      level,
      service: this.appConfig.serviceName,
      environment: this.appConfig.environment,
      message: this.toMessage(message),
      requestId: RequestContext.get("requestId"),
      userId: RequestContext.get("userId"),
      userLevel: RequestContext.get("userLevel"),
      ...metadata,
    };
    const output = `${JSON.stringify(record, this.safeReplacer)}\n`;
    (level === "error" || level === "fatal"
      ? process.stderr
      : process.stdout
    ).write(output);
  }

  private params(values: unknown[]): LogMetadata {
    if (!values.length) return {};
    const context =
      typeof values.at(-1) === "string" ? String(values.at(-1)) : undefined;
    return {
      ...(context ? { context } : {}),
      ...(values.length > 1 ? { details: values.slice(0, -1) } : {}),
    };
  }

  private toMessage(message: unknown): string {
    if (message instanceof Error) return message.message;
    if (typeof message === "string") return message;
    try {
      return JSON.stringify(message, this.safeReplacer);
    } catch {
      return String(message);
    }
  }

  private safeReplacer(key: string, value: unknown): unknown {
    if (
      ["authorization", "cookie", "password", "token", "secret"].some(
        (sensitive) => key.toLowerCase().includes(sensitive),
      )
    ) {
      return "[REDACTED]";
    }
    if (value instanceof Error) {
      return { name: value.name, message: value.message, stack: value.stack };
    }
    return value;
  }
}
