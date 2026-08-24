/**
 * In-memory CSRF header token (pairs with HttpOnly `csrf_token` cookie).
 * Never stored in localStorage. The JWT access token is HttpOnly only.
 */
let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}
