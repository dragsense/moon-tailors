import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { getRequestTimezone } from "./timezone";
import {
  getApiAccessToken,
  isRefreshUnavailable,
  markRefreshUnavailable,
  setApiAccessToken,
} from "./token";
import { getCsrfToken, setCsrfToken } from "./csrf";
import { toQueryString } from "./query-params";
import { decryptionService } from "../encryption/decryption.service";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8088/server/api";

export type THttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Fail fast instead of spinning when the API is down or unreachable. */
const REQUEST_TIMEOUT_MS = 20_000;

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

type ApiErrorPayload = {
  message?: string | string[];
  error?: { message?: string } | string;
  exceptionType?: string;
  stack?: string;
};

type QueueEntry = {
  resolve: (token: string | null) => void;
  reject: (reason?: unknown) => void;
};

type SessionRefreshPayload = {
  user?: unknown;
  accessToken?: { token?: string; expiresIn?: number };
  csrfToken?: string;
  message?: string;
};

let isRefreshing = false;
let failedQueue: QueueEntry[] = [];
let unauthorizedHandler: (() => void) | null = null;
let sessionRefreshHandler: ((payload: SessionRefreshPayload) => void) | null =
  null;

/** Set by the auth/session layer to clear local state after refresh fails. */
export function setApiUnauthorizedHandler(
  handler: (() => void) | null,
): void {
  unauthorizedHandler = handler;
}

/** Set by the auth/session layer to keep `/auth/me` in sync after refresh. */
export function setApiSessionRefreshHandler(
  handler: ((payload: SessionRefreshPayload) => void) | null,
): void {
  sessionRefreshHandler = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

/** Separate instance prevents refresh requests from entering the 401 loop. */
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

function applyCommonHeaders(config: InternalAxiosRequestConfig): void {
  const headers = AxiosHeaders.from(config.headers);
  const token = getApiAccessToken();
  const csrf = getCsrfToken();

  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (csrf) headers.set("X-CSRF-Token", csrf);
  headers.set("X-Timezone", getRequestTimezone());
  config.headers = headers;
}

api.interceptors.request.use((config) => {
  applyCommonHeaders(config);
  return config;
});

refreshApi.interceptors.request.use((config) => {
  applyCommonHeaders(config);
  return config;
});

/** Fetch or reuse CSRF token for cookie-auth routes (refresh / logout). */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;

  try {
    const response = await refreshApi.get<{ csrfToken?: string }>("/auth/csrf");
    const data = await unwrapData<{ csrfToken?: string }>(response.data);
    if (typeof data?.csrfToken === "string") {
      setCsrfToken(data.csrfToken);
      return data.csrfToken;
    }
  } catch {
    /* CSRF optional when CSRF_ENABLED=false */
  }
  return getCsrfToken();
}

function captureCsrfFromPayload(data: unknown): void {
  if (!data || typeof data !== "object") return;
  const token = (data as { csrfToken?: unknown }).csrfToken;
  if (typeof token === "string" && token) setCsrfToken(token);
}

function processQueue(error: unknown, token: string | null = null): void {
  for (const entry of failedQueue) {
    if (error) entry.reject(error);
    else entry.resolve(token);
  }
  failedQueue = [];
}

function isAuthRequest(url?: string): boolean {
  return [
    "/auth/login",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => url?.includes(path));
}

async function unwrapData<T>(data: unknown): Promise<T> {
  return (await decryptionService.decryptResponse(data)) as T;
}

api.interceptors.response.use(
  async (response) => {
    response.data = await unwrapData(response.data);
    const token = (response.data as { accessToken?: { token?: string } })
      ?.accessToken?.token;
    if (typeof token === "string") setApiAccessToken(token);
    captureCsrfFromPayload(response.data);
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      isAuthRequest(original.url) ||
      isRefreshUnavailable()
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      try {
        const token = await new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        original._retry = true;
        if (token) original.headers.set("Authorization", `Bearer ${token}`);
        return api(original);
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await ensureCsrfToken();
      const response = await refreshApi.post("/auth/refresh", {});
      const data = await unwrapData<SessionRefreshPayload>(response.data);
      const token = data?.accessToken?.token;
      if (typeof token !== "string") {
        throw new Error("Refresh response missing access token");
      }

      setApiAccessToken(token);
      captureCsrfFromPayload(data);
      sessionRefreshHandler?.(data);
      processQueue(null, token);
      original.headers.set("Authorization", `Bearer ${token}`);
      return api(original);
    } catch (refreshError) {
      setApiAccessToken(null);
      markRefreshUnavailable();
      processQueue(refreshError, null);
      unauthorizedHandler?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function toApiError(error: unknown): Error {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return error instanceof Error ? error : new Error("Something went wrong");
  }

  const status = error.response?.status;
  const payload = error.response?.data;
  const raw =
    payload?.message ??
    (typeof payload?.error === "string"
      ? payload.error
      : payload?.error?.message);
  const baseMessage = Array.isArray(raw)
    ? raw.join(", ")
    : raw || error.message || "Something went wrong";

  if (!import.meta.env.DEV) return new ApiError(baseMessage, status);

  let detail = baseMessage;
  if (status) detail += ` (Status: ${status})`;
  if (payload?.exceptionType) detail += ` [${payload.exceptionType}]`;

  const apiError = new ApiError(detail, status);
  if (payload?.stack) {
    apiError.stack = `${apiError.stack}\n\nServer Stack:\n${payload.stack}`;
  }
  return apiError;
}

/**
 * JSON API request through the shared Axios instance.
 *
 * @example
 * apiRequest<ITask>("/tasks", "GET")
 * apiRequest<ITask>("/tasks", "POST", body)
 * apiRequest<ITask>("/tasks/1", { method: "PATCH", data: body })
 */
export async function apiRequest<T>(
  path: string,
  methodOrOptions: THttpMethod | AxiosRequestConfig = "GET",
  body?: unknown,
): Promise<T> {
  const requestConfig: AxiosRequestConfig =
    typeof methodOrOptions === "string"
      ? {
          method: methodOrOptions,
          data: body,
        }
      : methodOrOptions;

  try {
    const response = await api.request<T>({
      url: path,
      ...requestConfig,
    });
    if (response.status === 204) return null as T;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Multipart / binary upload (do not set Content-Type — browser sets boundary). */
export async function apiFileRequest<T>(
  path: string,
  method: "POST" | "PATCH" | "PUT",
  data: FormData,
): Promise<T> {
  return apiRequest<T>(path, { method, data });
}

export async function downloadFile(
  path: string,
  fileName?: string,
  mimeType?: string,
): Promise<void> {
  const response = await api.get<Blob>(path, { responseType: "blob" });
  const blob = response.data;
  const type = mimeType ?? blob.type;
  const file = type ? new Blob([blob], { type }) : blob;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = fileName || `file_${Date.now()}`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function downloadFileWithName(path: string): Promise<void> {
  const response = await api.get<Blob>(path, { responseType: "blob" });
  const disposition = response.headers["content-disposition"];
  let fileName = `file_${Date.now()}`;
  const match = disposition?.match(/filename="?([^";\n]+)"?/);
  if (match?.[1]) fileName = match[1];
  const link = document.createElement("a");
  link.href = URL.createObjectURL(response.data);
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function buildApiUrl(
  apiPath: string,
  opts?: {
    id?: string | number;
    customPath?: string;
    query?: Record<string, unknown>;
  },
): string {
  let url = opts?.customPath ? `${apiPath}${opts.customPath}` : apiPath;
  if (opts?.id != null && opts.id !== "") url += `/${opts.id}`;
  url += toQueryString(opts?.query);
  return url;
}
