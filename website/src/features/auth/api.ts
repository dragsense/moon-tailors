import { getSiteConfig } from "@/config";

/**
 * Website → API. Cookie session lives on the gateway `/auth/me`.
 */
export async function fetchShopSession(
  apiUrl = getSiteConfig().apiUrl,
): Promise<boolean> {
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
