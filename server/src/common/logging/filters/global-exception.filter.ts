import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { RequestContext } from "../../context";
import { AppLoggerService } from "../services/app-logger.service";

type HttpErrorBody = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    if (response.headersSent) return;

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const error = exception instanceof Error ? exception : undefined;
    const body = this.httpBody(exception);
    const isDevelopment = process.env.NODE_ENV !== "production";

    this.logger.exception(
      {
        method: request.method,
        path: request.path,
        statusCode,
        exceptionType: error?.name ?? "UnknownException",
      },
      error,
    );

    response.status(statusCode).json({
      statusCode,
      message:
        statusCode >= 500 && !isDevelopment
          ? "Internal Server Error"
          : body.message,
      ...(body.error ? { error: body.error } : {}),
      path: request.path,
      timestamp: new Date().toISOString(),
      requestId: RequestContext.get("requestId"),
      ...(isDevelopment && error
        ? { exceptionType: error.name, stack: error.stack }
        : {}),
    });
  }

  private httpBody(exception: unknown): Required<Pick<HttpErrorBody, "message">> &
    Pick<HttpErrorBody, "error"> {
    if (!(exception instanceof HttpException)) {
      return {
        message:
          exception instanceof Error
            ? exception.message
            : "Internal Server Error",
      };
    }

    const response = exception.getResponse();
    if (typeof response === "string") return { message: response };
    const body = response as HttpErrorBody;
    return {
      message: body.message ?? exception.message,
      ...(body.error ? { error: body.error } : {}),
    };
  }
}
