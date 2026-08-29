import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { getRequestTimezone } from "./timezone";
import { getCsrfToken, setCsrfToken } from "./csrf";
import { toQueryString } from "./query-params";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

/** Loopback API hosts become `/server/api` so tunnels/LAN stay on the page origin. */
function resolveApiBaseUrl(raw: string | undefined): string {
  const fallback = "/server/api";
  const value = (raw ?? fallback).trim();
  if (!value) return fallback;
  if (value.startsWith("/")) return value.replace(/\/$/, "") || fallback;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    const path = url.pathname.replace(/\/$/, "") || fallback;
    if (LOOPBACK_HOSTS.has(host) || host.endsWith(".localhost")) return path;
    return `${url.origin}${path}`;
  } catch {
    return fallback;
  }
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);

export type THttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/** Fail fast instead of spinning when the API is down or unreachable. */
const REQUEST_TIMEOUT_MS = 20_000;

type ApiErrorPayload = {
  message?: string | string[];
  error?: { message?: string } | string;
  exceptionType?: string;
  stack?: string;
};

let unauthorizedHandler: (() => void) | null = null;

/** Set by root (`clearAuthCache`) to clear local state after a 401. */
export function setApiUnauthorizedHandler(
  handler: (() => void) | null,
): void {
  unauthorizedHandler = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

let csrfInflight: Promise<string | null> | null = null;

/** Load CSRF once (shared). Uses raw axios so it does not re-enter the interceptor. */
async function ensureCsrfToken(): Promise<string | null> {
  const existing = getCsrfToken();
  if (existing) return existing;
  if (csrfInflight) return csrfInflight;

  csrfInflight = (async () => {
    try {
      const { data } = await axios.get<{ csrfToken?: string }>(
        `${API_BASE_URL}/auth/csrf`,
        {
          withCredentials: true,
          timeout: REQUEST_TIMEOUT_MS,
        },
      );
      if (typeof data?.csrfToken === "string") {
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch {
      /* CSRF optional when CSRF_ENABLED=false */
    } finally {
      csrfInflight = null;
    }
    return getCsrfToken();
  })();

  return csrfInflight;
}

function applyCommonHeaders(config: InternalAxiosRequestConfig): void {
  const headers = AxiosHeaders.from(config.headers);
  const csrf = getCsrfToken();
  if (csrf) headers.set("X-CSRF-Token", csrf);
  headers.set("X-Timezone", getRequestTimezone());
  config.headers = headers;
}

api.interceptors.request.use(async (config) => {
  await ensureCsrfToken();
  applyCommonHeaders(config);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
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
