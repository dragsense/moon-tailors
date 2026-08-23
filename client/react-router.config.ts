import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Config } from "@react-router/dev/config";

/** Accept only `true` / `false`. */
function isTruthySsr(raw: string | undefined): boolean | undefined {
  if (raw == null || raw === "") return undefined;
  const v = raw.trim().toLowerCase();
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

/**
 * SSR when CLIENT_SSR=true.
 * Prefer process.env (Docker compose); else read monorepo `env/client.env`.
 * Deploy `clientMode=ssr` forces true; static modes force false.
 */
function resolveClientSsr(): boolean {
  const fromEnv = isTruthySsr(process.env.CLIENT_SSR);
  if (fromEnv !== undefined) return fromEnv;

  const file = resolve(process.cwd(), "../env/client.env");
  if (!existsSync(file)) return false;
  try {
    const m = readFileSync(file, "utf8").match(/^\s*CLIENT_SSR\s*=\s*(.+)$/m);
    return isTruthySsr(m?.[1]) ?? false;
  } catch {
    return false;
  }
}

export default {
  ssr: resolveClientSsr(),
  appDirectory: "app",
  // Match Vite base + gateway path http://…/app/
  basename: "/app",
} satisfies Config;
