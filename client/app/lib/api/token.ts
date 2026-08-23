/**
 * In-memory access token for the HTTP client.
 * Kept separate from the session cookie so the fetcher stays framework-agnostic.
 */

let accessToken: string | null = null;
let refreshUnavailable = false;

export function setApiAccessToken(token: string | null): void {
  accessToken = token;
  if (token) refreshUnavailable = false;
}

export function getApiAccessToken(): string | null {
  return accessToken;
}

/** Stops guests from retrying a refresh cookie the server already rejected. */
export function markRefreshUnavailable(): void {
  refreshUnavailable = true;
}

export function isRefreshUnavailable(): boolean {
  return refreshUnavailable;
}
