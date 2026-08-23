import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";

function logEnvironment(level: "info" | "warn", message: string): void {
  process.stdout.write(
    `${JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      service: process.env.SERVICE_NAME ?? "template-server",
      context: "Environment",
      message,
    })}\n`,
  );
}

/**
 * Load env from a mounted file at process start.
 * Edit the host file → restart process → new values apply (no image rebuild).
 */
export function loadEnv(): string | null {
  const candidates = [
    process.env.ENV_FILE,
    "/app/env/server.env",
    resolve(process.cwd(), "../../env/server.env"),
    resolve(process.cwd(), "../env/server.env"),
    resolve(process.cwd(), "env/server.env"),
    resolve(process.cwd(), ".env"),
  ].filter((p): p is string => Boolean(p));

  for (const filePath of candidates) {
    if (!existsSync(filePath)) continue;

    loadDotenv({ path: filePath, override: true });
    logEnvironment("info", `loaded ${filePath}`);
    return filePath;
  }

  logEnvironment("warn", "no env file found; using process environment only");
  return null;
}

// Entry points import this before reading or validating configuration.
loadEnv();
