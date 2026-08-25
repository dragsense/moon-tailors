/**
 * App is served under Vite/React Router `basename` (gateway `/app`).
 * Router `Link`/`navigate` already prefix it; `window.location` does not.
 */

export function appBasePath(): string {
  const raw = import.meta.env.BASE_URL || "/";
  return raw.replace(/\/$/, "") || "";
}

/** Strip basename → path Router uses (`/app/dashboard` → `/dashboard`). */
export function stripAppBasename(pathname: string): string {
  const base = appBasePath();
  if (!base) return pathname || "/";
  if (pathname === base) return "/";
  if (pathname.startsWith(`${base}/`)) {
    return pathname.slice(base.length) || "/";
  }
  return pathname || "/";
}

/** Build an absolute browser URL path with basename (`/dashboard` → `/app/dashboard`). */
export function withAppBasename(path: string): string {
  const base = appBasePath();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  if (normalized === "/") return `${base}/`;
  return `${base}${normalized}`;
}
