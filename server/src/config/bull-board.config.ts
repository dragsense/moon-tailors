import { registerAs } from "@nestjs/config";

export type BullBoardConfig = {
  /** Env: BULL_BOARD_ENABLED (default true outside production). */
  enabled: boolean;
  /** Mount path (under Nest global prefix). Env: BULL_BOARD_ROUTE. */
  route: string;
  /** Optional HTTP basic auth. Env: BULL_BOARD_USER / BULL_BOARD_PASSWORD. */
  user?: string;
  password?: string;
};

function parseBool(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === "true";
}

/** Same default as config — use when wiring DynamicModules before DI. */
export function isBullBoardEnabled(): boolean {
  return parseBool(
    process.env.BULL_BOARD_ENABLED,
    process.env.NODE_ENV !== "production",
  );
}

export default registerAs("bullBoard", (): BullBoardConfig => ({
  enabled: isBullBoardEnabled(),
  route: process.env.BULL_BOARD_ROUTE ?? "queues",
  user: process.env.BULL_BOARD_USER || undefined,
  password: process.env.BULL_BOARD_PASSWORD || undefined,
}));
