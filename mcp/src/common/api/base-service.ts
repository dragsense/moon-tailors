import { Injectable } from "@nestjs/common";
import { ApiClient } from "./api-client";

/**
 * Feature API services extend this (mirrors client `BaseService`).
 *
 * @example
 * class TasksApiService extends BaseApiService {
 *   constructor(api: ApiClient) { super(api, "/tasks"); }
 *   list(query) { return this.get(query); }
 * }
 */
@Injectable()
export abstract class BaseApiService {
  constructor(
    protected readonly api: ApiClient,
    protected readonly resourcePath: string,
  ) {}

  protected get<T>(
    query?: Record<string, unknown>,
    customPath?: string,
  ): Promise<T> {
    return this.api.request<T>("GET", this.path(customPath), { query });
  }

  protected getSingle<T>(
    id: string,
    query?: Record<string, unknown>,
    customPath?: string,
  ): Promise<T> {
    const segment = customPath
      ? `${this.resourcePath}${customPath}`
      : `${this.resourcePath}/${id}`;
    return this.api.request<T>("GET", segment, { query });
  }

  protected post<T>(
    body: unknown,
    query?: Record<string, unknown>,
    customPath?: string,
  ): Promise<T> {
    return this.api.request<T>("POST", this.path(customPath), { body, query });
  }

  protected patch<T>(
    id: string,
    body: unknown,
    query?: Record<string, unknown>,
  ): Promise<T> {
    return this.api.request<T>("PATCH", `${this.resourcePath}/${id}`, {
      body,
      query,
    });
  }

  protected delete<T>(id: string): Promise<T> {
    return this.api.request<T>("DELETE", `${this.resourcePath}/${id}`);
  }

  private path(customPath?: string): string {
    if (!customPath) return this.resourcePath;
    return customPath.startsWith("/")
      ? `${this.resourcePath}${customPath}`
      : `${this.resourcePath}/${customPath}`;
  }
}
