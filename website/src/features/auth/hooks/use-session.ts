import { useEffect, useState } from "react";
import { getSiteConfig } from "@/config";
import { fetchShopSession } from "../api";

export type ShopSessionState = {
  signedIn: boolean | null;
  isLoading: boolean;
};

/** Detects the shop cookie session via `GET /auth/me`. */
export function useSession(): ShopSessionState {
  const apiUrl = getSiteConfig().apiUrl;
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchShopSession(apiUrl).then((ok) => {
      if (!cancelled) setSignedIn(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  return {
    signedIn,
    isLoading: signedIn === null,
  };
}
