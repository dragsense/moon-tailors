import type {
  IMessageResponse,
  IPaginatedResponse,
} from "@moon-tailors/contracts";
import {
  apiFileRequest,
  apiRequest,
  buildApiUrl,
  downloadFile,
  downloadFileWithName,
} from "./api";

export type TListQueryParams = {
  page?: number;
  limit?: number;
} & Record<string, unknown>;

/** Flat paginated envelope (`IPaginatedResponse`). */
export type TPaginatedResponse<T> = IPaginatedResponse<T>;

/**
 * Generic base service for CRUD against a resource path.
 * Feature services extend this (or use `createService`) to cut duplication.
 *
 * @example
 * class TasksService extends BaseService<ITask, TCreateTaskData, TUpdateTaskData> {
 *   constructor() { super("/tasks"); }
 * }
 * export const tasksService = new TasksService();
 */
export class BaseService<
  TEntity,
  TCreateData extends Record<string, unknown> = Record<string, unknown>,
  TUpdateData extends Record<string, unknown> = Record<string, unknown>,
> {
  protected apiPath: string;

  constructor(apiPath: string) {
    this.apiPath = apiPath.startsWith("/") ? apiPath : `/${apiPath}`;
  }

  /** Paginated list (`GET /resource?page&limit…`). */
  get<TResponse = TEntity>(
    params: TListQueryParams = {},
    customPath?: string,
  ) {
    const url = buildApiUrl(this.apiPath, {
      customPath,
      query: params,
    });
    return apiRequest<TPaginatedResponse<TResponse>>(url, "GET");
  }

  /** Full list without assuming pagination shape. */
  getAll<TResponse = TEntity>(
    params?: Record<string, unknown>,
    customPath?: string,
  ) {
    const url = buildApiUrl(this.apiPath, { customPath, query: params });
    return apiRequest<TResponse[]>(url, "GET");
  }

  /** Single entity by id. */
  getSingle<TResponse = TEntity>(
    id?: string | number,
    queryParams?: Record<string, unknown>,
    customPath?: string,
  ) {
    const url = buildApiUrl(this.apiPath, {
      id,
      customPath,
      query: queryParams,
    });
    return apiRequest<TResponse>(url, "GET");
  }

  /** Create. */
  post<TResponse = TEntity>(
    data: TCreateData | TUpdateData,
    queryParams?: Record<string, unknown>,
    customPath?: string,
  ) {
    const url = buildApiUrl(this.apiPath, {
      customPath,
      query: queryParams,
    });
    return apiRequest<TResponse>(url, "POST", data);
  }

  /** Full replace by id (`put(id)(data)`). */
  put<TResponse = IMessageResponse>(id?: string | number) {
    return (
      data: TUpdateData,
      queryParams?: Record<string, unknown>,
      customPath?: string,
    ) => {
      const url = buildApiUrl(this.apiPath, {
        id,
        customPath,
        query: queryParams,
      });
      return apiRequest<TResponse>(url, "PUT", data);
    };
  }

  /** Partial update by id (`patch(id)(data)`). */
  patch<TResponse = TEntity>(id?: string | number) {
    return (
      data: TUpdateData,
      queryParams?: Record<string, unknown>,
      customPath?: string,
    ) => {
      const url = buildApiUrl(this.apiPath, {
        id,
        customPath,
        query: queryParams,
      });
      return apiRequest<TResponse>(url, "PATCH", data);
    };
  }

  /** Delete by id/key. */
  delete<TResponse = IMessageResponse>(
    key?: string | number,
    queryParams?: Record<string, unknown>,
    customPath?: string,
  ) {
    const url = buildApiUrl(this.apiPath, {
      id: key,
      customPath,
      query: queryParams,
    });
    return apiRequest<TResponse>(url, "DELETE");
  }

  /** POST with FormData (files). */
  postFormData<TResponse = IMessageResponse>(
    data: Record<string, unknown>,
    queryParams?: Record<string, unknown>,
    customPath?: string,
  ) {
    const formData = toFormData(data);
    const url = buildApiUrl(this.apiPath, {
      customPath,
      query: queryParams,
    });
    return apiFileRequest<TResponse>(url, "POST", formData);
  }

  /** PUT with FormData (`putFormData(id?)(data)`). */
  putFormData<TResponse = IMessageResponse>(id?: string | number) {
    return (
      data: Record<string, unknown>,
      queryParams?: Record<string, unknown>,
      customPath?: string,
    ) => {
      const formData = toFormData(data);
      const url = buildApiUrl(this.apiPath, {
        id,
        customPath,
        query: queryParams,
      });
      return apiFileRequest<TResponse>(url, "PUT", formData);
    };
  }

  /** PATCH with FormData (`patchFormData(id)(data)`). */
  patchFormData<TResponse = IMessageResponse>(id?: string | number) {
    return (
      data: Record<string, unknown>,
      queryParams?: Record<string, unknown>,
      customPath?: string,
    ) => {
      const formData = toFormData(data);
      const url = buildApiUrl(this.apiPath, {
        id,
        customPath,
        query: queryParams,
      });
      return apiFileRequest<TResponse>(url, "PATCH", formData);
    };
  }

  downloadFile(
    endpoint: string,
    fileName?: string,
    queryParams?: Record<string, unknown>,
    mimeType?: string,
  ) {
    const url = buildApiUrl(`${this.apiPath}${endpoint}`, {
      query: queryParams,
    });
    return downloadFile(url, fileName, mimeType);
  }

  downloadFileWithName(
    endpoint: string,
    queryParams?: Record<string, unknown>,
  ) {
    const url = buildApiUrl(`${this.apiPath}${endpoint}`, {
      query: queryParams,
    });
    return downloadFileWithName(url);
  }
}

export function createService<
  TEntity,
  TCreateData extends Record<string, unknown> = Record<string, unknown>,
  TUpdateData extends Record<string, unknown> = Record<string, unknown>,
>(apiPath: string): BaseService<TEntity, TCreateData, TUpdateData> {
  return new BaseService<TEntity, TCreateData, TUpdateData>(apiPath);
}

function toFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        formData.append(key, JSON.stringify([]));
        continue;
      }
      const hasFiles = value.some(
        (item) => item instanceof File || item instanceof Blob,
      );
      if (hasFiles) {
        for (const item of value) {
          if (item instanceof File || item instanceof Blob) {
            formData.append(key, item);
          }
        }
      } else {
        const hasObjects = value.some(
          (item) => typeof item === "object" && item !== null,
        );
        if (hasObjects) {
          formData.append(key, JSON.stringify(value));
        } else {
          for (const item of value) {
            formData.append(`${key}[]`, String(item));
          }
        }
      }
      continue;
    }

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
      continue;
    }

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      continue;
    }

    formData.append(key, String(value));
  }

  return formData;
}
