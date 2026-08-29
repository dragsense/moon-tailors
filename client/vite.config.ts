import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appDir = fileURLToPath(new URL("./app", import.meta.url));

/** Canonical path inside the container is `/app/env/client.env` (compose mounts env/<host>/client.env there). */
function loadClientEnv(): Record<string, string> {
  const candidates = [
    "/app/env/client.env",
    path.resolve(__dirname, "../env/client.env"),
  ];
  const out: Record<string, string> = {};
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
      out[key] = value;
    }
    return out;
  }
  return out;
}

function viteEnvDefine(env: Record<string, string>): Record<string, string> {
  const define: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("VITE_")) {
      define[`import.meta.env.${key}`] = JSON.stringify(value);
    }
  }
  return define;
}

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

export default defineConfig(({ command }) => {
  const clientEnv = loadClientEnv();
  for (const [key, value] of Object.entries(clientEnv)) {
    process.env[key] = value;
  }

  return {
    // Do not load client/.env.* — only env/client.env (via define below).
    envDir: path.resolve(__dirname, "../env"),
    // Gateway path /app/. Dev needs no trailing slash (React Router + Vite quirk).
    base: command === "serve" ? "/app" : "/app/",
    plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
    define: {
      ...viteEnvDefine(clientEnv),
    },
    resolve: {
      // routes.ts is loaded by vite-node before tsconfigPaths applies, so `~`
      // needs a real alias or route config imports fail at startup.
      alias: [{ find: /^~\//, replacement: `${appDir}/` }],
      // Docker + pnpm named volumes can surface multiple React copies; forces one.
      dedupe: ["react", "react-dom", "react-router"],
      conditions:
        command === "serve"
          ? ["development", "import", "module", "browser", "default"]
          : undefined,
    },
    optimizeDeps: {
      // Pre-bundle so adding/using shadcn deps does not invalidate Vite chunks mid-session
      // (that race often surfaces as React useContext null / missing .vite/deps files).
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router",
        "react-router/dom",
        "radix-ui",
        "class-variance-authority",
        "clsx",
        "tailwind-merge",
        "lucide-react",
        "react-hook-form",
        "@hookform/resolvers/zod",
        "zod",
        "@tanstack/react-query",
        "zustand",
        "axios",
        "socket.io-client",
      ],
      exclude: ["@moon-tailors/contracts"],
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      watch: watchPolling(),
      warmup: {
        clientFiles: ["./app/root.tsx", "./app/routes.ts"],
      },
    },
  };
});
