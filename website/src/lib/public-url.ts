/**
 * Gateway URLs for the public site.
 * Loopback hosts (Docker local env) become origin-relative paths so tunnels
 * and LAN hostnames keep login + session on the page the user opened.
 * Absolute URLs to a real hostname stay as configured (split deploy).
 */

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return LOOPBACK_HOSTS.has(host) || host.endsWith(".localhost");
}

export function sameOriginGatewayUrl(
  raw: string | undefined,
  fallbackPath: string,
): string {
  const fallback = fallbackPath.replace(/\/$/, "") || "/";
  const value = (raw ?? fallback).trim();
  if (!value) return fallback;
  if (value.startsWith("/")) return value.replace(/\/$/, "") || fallback;

  try {
    const url = new URL(value);
    const path = url.pathname.replace(/\/$/, "") || fallback;
    if (isLoopbackHost(url.hostname)) return path;
    return `${url.origin}${path}`;
  } catch {
    return fallback;
  }
}
