/**
 * In-memory CSRF token (pairs with HttpOnly `csrf_token` cookie).
 * Same pattern as the access token — never stored in localStorage.
 */
let csrfToken: string | null = null;

export function getCsrfToken(): string | null {
  return csrfToken;
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}
