/**
 * Shared HTTP client + resource service helpers.
 *
 * ```txt
 * lib/api/
 *   http.ts          Axios client, apiRequest, downloads
 *   query-params.ts  query string builders
 *   base-service.ts  BaseService CRUD base class
 *   csrf.ts / timezone.ts
 * ```
 *
 * Feature modules keep their own `features/<name>/api.ts` (domain services).
 */
export {
  api,
  ApiError,
  API_BASE_URL,
  apiRequest,
  apiFileRequest,
  buildApiUrl,
  downloadFile,
  downloadFileWithName,
  isUnauthorizedError,
  setApiUnauthorizedHandler,
  type THttpMethod,
} from "./http";
export { getCsrfToken, setCsrfToken } from "./csrf";
export {
  getBrowserTimezone,
  getRequestTimezone,
  setPreferredTimezone,
} from "./timezone";
export { generateQueryParams, toQueryString } from "./query-params";
export {
  BaseService,
  createService,
  type TListQueryParams,
  type TPaginatedResponse,
} from "./base-service";
