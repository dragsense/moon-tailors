/**
 * Website and API share the gateway origin. The access JWT is an HttpOnly
 * cookie on `{publicServerPath}/api` (e.g. `/server/api`). `GET /auth/me`
 * with credentials is enough to detect a shop session.
 */
export async function hasShopSession(apiUrl: string): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, "");
  try {
    const meRes = await fetch(`${base}/auth/me`, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return meRes.ok;
  } catch {
    return false;
  }
}
