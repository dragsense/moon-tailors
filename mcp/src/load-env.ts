import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

/**
 * Load env/mcp.env (or ENV_FILE) before Nest Config reads process.env.
 */
export function loadEnv(): string | null {
  const candidates = [
    process.env.ENV_FILE,
    "/app/env/mcp.env",
    resolve(process.cwd(), "../../env/mcp.env"),
    resolve(process.cwd(), "../env/mcp.env"),
    resolve(process.cwd(), "env/mcp.env"),
    resolve(process.cwd(), ".env"),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;
    loadDotenv({ path: filePath, override: true });
    return filePath;
  }
  return null;
}

loadEnv();
