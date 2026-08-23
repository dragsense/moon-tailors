import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const websiteDir = path.dirname(fileURLToPath(import.meta.url));

/** Repo `env/website.env` — Docker mounts it at /app/env/website.env. */
function loadWebsiteEnv() {
  const candidates = [
    "/app/env/website.env",
    path.resolve(websiteDir, "../env/website.env"),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      let value = t.slice(i + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
    return;
  }
}

loadWebsiteEnv();

/**
 * Docker/WSL bind mounts often drop inotify — poll so deletes/edits rebuild.
 * Compose sets CHOKIDAR_USEPOLLING; default stays polling for Docker local.
 */
function watchPolling() {
  const disabled =
    process.env.CHOKIDAR_USEPOLLING === "false" ||
    process.env.CHOKIDAR_USEPOLLING === "0";
  if (disabled) return {};
  const interval = Number(process.env.WATCHPACK_POLL_INTERVAL || 1000);
  return {
    usePolling: true,
    interval: Number.isFinite(interval) ? interval : 1000,
  };
}

export default defineConfig({
  integrations: [react()],
  output: "static",
  vite: {
    envDir: path.resolve(websiteDir, "../env"),
    plugins: [tailwindcss()],
    server: {
      host: "0.0.0.0",
      watch: watchPolling(),
    },
  },
});
