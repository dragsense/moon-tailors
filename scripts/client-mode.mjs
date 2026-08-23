/**
 * Resolve deploy-only client hosting mode.
 * Dev (Vite) ignores this — only production/staging Docker + CDN deploys use it.
 *
 *   nginx  — build SPA; gateway serves static files at /app (no client container)
 *   ssr    — Docker: Node react-router-serve; gateway reverse-proxies /app
 *   nest   — same SPA build as nginx; Nest serves it (mounted); gateway proxies /app to server
 *   cdn    — upload SPA files; no client container
 */
export const CLIENT_MODES = ["nginx", "ssr", "nest", "cdn"];

/**
 * @param {string | undefined} mode
 * @returns {"nginx" | "ssr" | "nest" | "cdn"}
 */
export function normalizeClientMode(mode) {
  const m = String(mode || "nginx").toLowerCase().trim();
  if (CLIENT_MODES.includes(m)) return /** @type {"nginx" | "ssr" | "nest" | "cdn"} */ (m);
  throw new Error(
    `Unknown clientMode "${mode}". Use: ${CLIENT_MODES.join(" | ")}`,
  );
}

/** Modes that run a dedicated client Docker service. */
export function clientUsesDockerService(mode) {
  const m = normalizeClientMode(mode);
  return m === "ssr";
}

/** Modes that need a static SPA build (ssr:false). */
export function clientNeedsStaticSpaBuild(mode) {
  const m = normalizeClientMode(mode);
  return m === "nginx" || m === "nest" || m === "cdn";
}
