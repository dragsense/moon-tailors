/**
 * HTTP client + resource service helpers.
 *
 * ```txt
 * lib/api/
 *   api.ts           apiRequest, buildApiUrl, downloads
 *   query-params.ts  query string builders
 *   base-service.ts  BaseService CRUD base class
 * ```
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
  ensureCsrfToken,
  isUnauthorizedError,
  setApiSessionRefreshHandler,
  setApiUnauthorizedHandler,
  type THttpMethod,
} from "./api";
export { getApiAccessToken, setApiAccessToken } from "./token";
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
