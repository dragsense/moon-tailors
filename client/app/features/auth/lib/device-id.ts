const DEVICE_ID_STORAGE_KEY = "app.deviceId";

/** Stable per-browser id used for trusted-device OTP skip. */
export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)?.trim();
    if (existing) return existing;
    const next =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, next);
    return next;
  } catch {
    return "";
  }
}

export function readDeviceId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return localStorage.getItem(DEVICE_ID_STORAGE_KEY)?.trim() || undefined;
  } catch {
    return undefined;
  }
}
