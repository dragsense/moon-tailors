import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { McpConfig } from "../../config";

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Thin HTTP client for the Nest API — same role as client `lib/api`.
 * Feature services extend `BaseApiService` instead of inventing fetch maps.
 */
@Injectable()
export class ApiClient {
  constructor(private readonly config: ConfigService) {}

  private get mcp(): McpConfig {
    return this.config.getOrThrow<McpConfig>("mcp");
  }

  async request<T>(
    method: string,
    path: string,
    options?: {
      query?: Record<string, unknown>;
      body?: unknown;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const url = this.buildUrl(path, options?.query);
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...(options?.headers ?? {}),
    };
    if (this.mcp.apiKey) {
      headers["x-api-key"] = this.mcp.apiKey;
    }
    let body: string | undefined;
    if (options?.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const res = await fetch(url, { method, headers, body });
    const text = await res.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const msg =
        typeof parsed === "object" &&
        parsed &&
        "message" in parsed &&
        typeof (parsed as { message: unknown }).message === "string"
          ? (parsed as { message: string }).message
          : `API ${res.status} ${method} ${path}`;
      throw new ApiClientError(msg, res.status, parsed);
    }

    return parsed as T;
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const base = this.mcp.apiBaseUrl.replace(/\/$/, "");
    const suffix = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${suffix}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null || value === "") continue;
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}
