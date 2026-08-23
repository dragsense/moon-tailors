/**
 * Clear Vite / React Router caches before `react-router dev`.
 * Avoids stale modules after Docker/WSL missed unlink events.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const rel of ["node_modules/.cache", "node_modules/.vite", ".vite"]) {
  try {
    rmSync(join(root, rel), { recursive: true, force: true });
  } catch {
    // ignore
  }
}
