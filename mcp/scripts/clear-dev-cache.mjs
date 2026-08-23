/**
 * Clear Nest/TS caches before `nest start --watch`.
 * Avoids stale modules after Docker/WSL missed unlink events.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const rel of ["node_modules/.cache", "dist"]) {
  try {
    rmSync(join(root, rel), { recursive: true, force: true });
  } catch {
    // ignore
  }
}
