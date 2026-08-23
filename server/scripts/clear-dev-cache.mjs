/**
 * Drop Nest/webpack TypeScript incremental cache before `nest start --watch`.
 * Prevents fork-ts-checker from keeping deleted modules (e.g. business-scope.ts)
 * after Docker/WSL missed an unlink event.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, "node_modules", ".cache");

try {
  rmSync(cacheDir, { recursive: true, force: true });
} catch {
  // ignore — cache may not exist yet
}
