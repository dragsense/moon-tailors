type RefreshPayload = {
  accessToken?: { token?: string };
};

/**
 * Website and API share the gateway origin. Refresh cookie is HttpOnly on
 * `{publicServerPath}/api/auth` (e.g. `/server/api/auth`). CSRF is skipped
 * on refresh, so a credentialed POST is enough to restore a session.
 */
export async function hasShopSession(apiUrl: string): Promise<boolean> {
  const base = apiUrl.replace(/\/$/, "");
  try {
    const refreshRes = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!refreshRes.ok) return false;

    const body = (await refreshRes.json()) as RefreshPayload;
    const token = body.accessToken?.token;
    if (!token) return false;

    const meRes = await fetch(`${base}/auth/me`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return meRes.ok;
  } catch {
    return false;
  }
}
