/**
 * Load docker/environments.json and build docker compose args.
 *
 * Environments: local (laptop) and production. Each nests
 *   server / client / website  — with env paths (+ server.needs for infra)
 *
 * Deploy picks one or more apps (multi-select or all) from that environment.
 *
 *   import { loadDockerEnvironment, listEnvApps, ... } from "./docker-env.mjs";
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  clientUsesDockerService,
  normalizeClientMode,
} from "./client-mode.mjs";
import { writePublishPortsCompose } from "./port-check.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = resolve(root, "docker/environments.json");

export const ENV_APPS = ["server", "client", "website"];
const SERVICE_ORDER = [
  "postgres",
  "redis",
  "server",
  "client",
  "website",
  "gateway",
];

/** website.mode: docker (default — gateway static) | cdn */
export function normalizeWebsiteMode(mode) {
  const m = String(mode || "docker").toLowerCase().trim();
  if (m === "cdn" || m === "static") return "cdn";
  return "docker";
}

/** Long-running website container? Never in prod — local Astro uses buildTarget=dev. */
export function websiteUsesDockerService(_mode) {
  return false;
}

function gatewayNginxTemplate(clientDev, websiteDev, clientMode) {
  if (clientDev || websiteDev) return "./nginx-gateway.conf.template";
  if (clientMode === "nest" || clientMode === "ssr") {
    return "./nginx-gateway.nest.conf.template";
  }
  return "./nginx-gateway.static.conf.template";
}

function readConfig() {
  if (!existsSync(configPath)) {
    throw new Error(`Missing ${configPath}`);
  }
  return JSON.parse(readFileSync(configPath, "utf8"));
}

function appBlock(envBlock, name) {
  const b = envBlock?.[name];
  return b && typeof b === "object" ? b : null;
}

/** Apps defined under this environment (for deploy multi-pick). */
export function listEnvApps(envName = "local") {
  const raw = readConfig();
  const name = envName === "prod" ? "production" : envName;
  const block = raw.environments?.[name];
  if (!block) return [];
  return ENV_APPS.filter((a) => appBlock(block, a));
}

/**
 * Expand selected apps → compose services (apps + server.needs infra).
 * @param {object} envBlock
 * @param {string[]} selectedApps server|client|website
 */
function expandServices(envBlock, selectedApps) {
  const set = new Set();
  const webApps = ["server", "client", "website"];
  for (const app of selectedApps) {
    if (!appBlock(envBlock, app)) continue;
    if (app === "website") {
      set.add("website");
      continue;
    }
    set.add(app);
    const needs = appBlock(envBlock, app).needs;
    if (Array.isArray(needs)) {
      for (const n of needs) set.add(n);
    }
  }
  // One edge nginx for the stack when gateway is configured
  if (
    appBlock(envBlock, "gateway") &&
    selectedApps.some((a) => webApps.includes(a))
  ) {
    set.add("gateway");
  }
  return SERVICE_ORDER.filter((s) => set.has(s));
}

function isDevMode(cfg) {
  return cfg.buildTarget === "dev" || cfg.nodeEnv === "development";
}

/** Read `KEY=value` from an env file (first match). */
function readEnvFileValue(relPath, key) {
  if (!relPath) return undefined;
  const abs = resolve(root, relPath);
  if (!existsSync(abs)) return undefined;
  try {
    const text = readFileSync(abs, "utf8");
    const re = new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, "m");
    const m = text.match(re);
    if (!m) return undefined;
    return m[1].trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

/**
 * Resolve CLIENT_SSR for compose / Vite (`true` / `false` only).
 * - clientMode=ssr → always "true"
 * - Vite/dev → honor env/client.env `CLIENT_SSR`
 * - static modes (nginx/nest/cdn) → "false"
 */
function resolveClientSsr(cfg, clientMode, clientDev) {
  if (clientMode === "ssr") return "true";
  if (!clientDev) return "false";
  const raw = String(readEnvFileValue(cfg.clientEnv, "CLIENT_SSR") ?? "")
    .trim()
    .toLowerCase();
  return raw === "true" ? "true" : "false";
}

function padVolumes(list, n, filler) {
  const out = [...list];
  while (out.length < n) out.push(filler);
  return out.slice(0, n);
}

function volumeSlots(cfg) {
  const envDir = cfg.envDir || "env";
  const toVol = (p, fallback) => {
    if (!p) return fallback;
    if (p.startsWith("env/") || p.includes("/")) return `../${p}`;
    return `../${envDir}/${p}`;
  };
  const pad = "server_logs:/tmp/.compose-pad";
  const serverEnv = toVol(cfg.serverEnv, pad);
  const clientEnv = toVol(cfg.clientEnv, pad);
  const websiteEnv = toVol(cfg.websiteEnv, pad);

  const spaMount = !isDevMode(cfg)
    ? "../client/build/client:/app/client-static:ro"
    : null;

  if (isDevMode(cfg)) {
    // Bind-mount host node_modules (and package trees include their own nm).
    // One install on the host → IDE + containers share the same tree.
    // Do not use named nm volumes — they hide host node_modules from the IDE.
    return {
      server: padVolumes(
        [
          "../server:/app/server",
          "../contracts:/app/contracts",
          "../package.json:/app/package.json",
          "../pnpm-workspace.yaml:/app/pnpm-workspace.yaml",
          // Lockfile omitted: Docker Desktop+WSL file binds go stale when pnpm rewrites it.
          "../.npmrc:/app/.npmrc:ro",
          `${serverEnv}:/app/env/server.env:ro`,
          "../node_modules:/app/node_modules",
        ],
        11,
        pad,
      ),
      client: padVolumes(
        [
          "../client:/app/client",
          "../contracts:/app/contracts",
          "../package.json:/app/package.json",
          "../pnpm-workspace.yaml:/app/pnpm-workspace.yaml",
          "../.npmrc:/app/.npmrc:ro",
          `${clientEnv}:/app/env/client.env:ro`,
          "../node_modules:/app/node_modules",
        ],
        10,
        pad,
      ),
      website: padVolumes(
        [
          "../website:/app/website",
          "../package.json:/app/package.json",
          "../pnpm-workspace.yaml:/app/pnpm-workspace.yaml",
          "../.npmrc:/app/.npmrc:ro",
          `${websiteEnv}:/app/env/website.env:ro`,
          "../node_modules:/app/node_modules",
        ],
        8,
        pad,
      ),
    };
  }

  return {
    server: padVolumes(
      [
        `${serverEnv}:/app/env/server.env:ro`,
        "server_logs:/app/logs",
        ...(spaMount ? [spaMount] : []),
      ],
      11,
      pad,
    ),
    client: padVolumes(
      [`${clientEnv}:/app/env/client.env:ro`],
      10,
      pad,
    ),
    website: padVolumes(
      [`${websiteEnv}:/app/env/website.env:ro`],
      8,
      pad,
    ),
  };
}

/**
 * @param {string} [name] environment name (= host name by default)
 * @param {{
 *   clientMode?: string,
 *   apps?: string[],
 *   dockerEnv?: string,
 *   serverEnv?: string,
 *   clientEnv?: string,
 *   websiteEnv?: string,
 * }} [opts]
 *   apps — subset to run (default: all apps defined in the environment)
 */
export function loadDockerEnvironment(name = "local", opts = {}) {
  const raw = readConfig();
  const envName = name === "prod" ? "production" : name;
  const envBlock = raw.environments?.[envName];
  if (!envBlock || typeof envBlock !== "object") {
    const known = Object.keys(raw.environments || {}).join(", ");
    throw new Error(
      `Unknown environment: ${name}\nKnown: ${known || "(none)"}\n` +
        `Host name should match a key under docker/environments.json → environments.`,
    );
  }

  const definedApps = ENV_APPS.filter((a) => appBlock(envBlock, a));
  let selectedApps = Array.isArray(opts.apps) && opts.apps.length
    ? opts.apps.filter((a) => definedApps.includes(a))
    : definedApps.slice(); // local/docker: all defined apps including website

  if (!selectedApps.length && definedApps.length) {
    selectedApps = definedApps.slice();
  }

  const server = appBlock(envBlock, "server");
  const client = appBlock(envBlock, "client");
  const website = appBlock(envBlock, "website");

  const dockerEnv =
    opts.dockerEnv || envBlock.dockerEnv || "env/docker.env";
  const serverEnv = opts.serverEnv || server?.env || "";
  const clientEnv = opts.clientEnv || client?.env || "";
  const websiteEnv = opts.websiteEnv || website?.env || "";
  const websiteDist = website?.dist || "website/dist";

  const serverBuildTarget = server?.buildTarget || "runtime";
  const clientBuildTargetCfg = client?.buildTarget || "runtime";
  const websiteBuildTargetCfg = website?.buildTarget || "runtime";
  const serverNodeEnv =
    server?.nodeEnv ||
    (serverBuildTarget === "dev" ? "development" : "production");
  const clientNodeEnv =
    client?.nodeEnv ||
    (clientBuildTargetCfg === "dev" ? "development" : "production");
  const websiteNodeEnv =
    website?.nodeEnv ||
    (websiteBuildTargetCfg === "dev" ? "development" : "production");
  const serverRestart =
    server?.restart || (serverBuildTarget === "dev" ? "no" : "unless-stopped");
  const clientRestart =
    client?.restart ||
    (clientBuildTargetCfg === "dev" ? "no" : "unless-stopped");
  const websiteRestart =
    website?.restart ||
    (websiteBuildTargetCfg === "dev" ? "no" : "unless-stopped");

  // Stack-level fallbacks (infra restart / isDevMode)
  const buildTarget =
    [serverBuildTarget, clientBuildTargetCfg, websiteBuildTargetCfg].find(
      (t) => t === "dev",
    ) ||
    serverBuildTarget ||
    clientBuildTargetCfg ||
    websiteBuildTargetCfg ||
    "runtime";
  const nodeEnv =
    buildTarget === "dev" ? "development" : serverNodeEnv || "production";
  const restart =
    buildTarget === "dev" ? "no" : serverRestart || "unless-stopped";

  if (selectedApps.includes("server") && !serverEnv) {
    throw new Error(`environments.${envName}.server.env is required`);
  }
  if (selectedApps.includes("client") && !clientEnv) {
    throw new Error(`environments.${envName}.client.env is required`);
  }

  let services = expandServices(envBlock, selectedApps);
  const clientMode = normalizeClientMode(
    opts.clientMode ||
      process.env.CLIENT_MODE ||
      client?.clientMode ||
      envBlock.clientMode ||
      "nginx",
  );
  // Local always runs website in Docker regardless of mode
  const websiteMode =
    envName === "local"
      ? "docker"
      : normalizeWebsiteMode(
          opts.websiteMode ||
            process.env.WEBSITE_MODE ||
            website?.mode ||
            envBlock.websiteMode ||
            "docker",
        );

  const merged = {
    projectName: envBlock.projectName || "moon-tailors",
    compose: envBlock.compose || raw.compose || "docker/compose.yml",
    envDir: envBlock.envDir || raw.envDir || "env",
    dockerEnv,
    serverEnv,
    clientEnv,
    websiteEnv,
    websiteDist,
    buildTarget,
    nodeEnv,
    restart,
    serverBuildTarget,
    clientBuildTarget: clientBuildTargetCfg,
    websiteBuildTarget: websiteBuildTargetCfg,
    serverNodeEnv,
    clientNodeEnv,
    websiteNodeEnv,
    serverRestart,
    clientRestart,
    websiteRestart,
    clientMode: client?.clientMode || envBlock.clientMode || "nginx",
    websiteMode,
    apps: selectedApps,
    definedApps,
  };

  if (!isDevMode(merged) && !clientUsesDockerService(clientMode)) {
    services = services.filter((s) => s !== "client");
  }
  if (!isDevMode(merged) && !websiteUsesDockerService(websiteMode)) {
    services = services.filter((s) => s !== "website");
  }

  return {
    name: envName,
    ...merged,
    clientMode,
    websiteMode,
    services,
    root,
  };
}

export function composeProcessEnv(cfg, extra = {}) {
  const vols = volumeSlots(cfg);
  const clientMode = normalizeClientMode(cfg.clientMode || "nginx");

  let clientBuildTarget = cfg.clientBuildTarget || cfg.buildTarget || "runtime";
  let serverBuildTarget = cfg.serverBuildTarget || cfg.buildTarget || "runtime";
  let websiteBuildTarget =
    cfg.websiteBuildTarget || cfg.buildTarget || "runtime";
  let clientContainerPort = "80";
  let websiteContainerPort = "80";

  const clientDev = clientBuildTarget === "dev";
  const serverDev = serverBuildTarget === "dev";
  const websiteDev = websiteBuildTarget === "dev";
  const anyDev = clientDev || serverDev || websiteDev;
  const imageSuffix = anyDev ? "-dev" : "";

  if (clientDev) {
    clientContainerPort = "5173";
  } else if (clientMode === "ssr") {
    clientBuildTarget = "ssr";
    clientContainerPort = "3000";
  } else if (clientMode === "nginx" || clientMode === "nest") {
    // Same SPA image (target=build). nginx: gateway files. nest: mount into server.
    clientBuildTarget = "build";
  }

  if (websiteDev) {
    websiteContainerPort = "4321";
  } else {
    websiteBuildTarget = "build";
  }

  const env = {
    COMPOSE_PROJECT_NAME: cfg.projectName || "moon-tailors",
    BUILD_TARGET: cfg.buildTarget || "runtime",
    CLIENT_BUILD_TARGET: clientBuildTarget,
    SERVER_BUILD_TARGET: serverBuildTarget,
    WEBSITE_BUILD_TARGET: websiteBuildTarget,
    CLIENT_MODE: clientMode,
    CLIENT_SSR: resolveClientSsr(cfg, clientMode, clientDev),
    NODE_ENV: cfg.nodeEnv || "production",
    SERVER_NODE_ENV: cfg.serverNodeEnv || cfg.nodeEnv || "production",
    CLIENT_NODE_ENV: cfg.clientNodeEnv || cfg.nodeEnv || "production",
    WEBSITE_NODE_ENV: cfg.websiteNodeEnv || cfg.nodeEnv || "production",
    RESTART_POLICY: cfg.restart || "unless-stopped",
    SERVER_RESTART: cfg.serverRestart || cfg.restart || "unless-stopped",
    CLIENT_RESTART: cfg.clientRestart || cfg.restart || "unless-stopped",
    WEBSITE_RESTART: cfg.websiteRestart || cfg.restart || "unless-stopped",
    IMAGE_SUFFIX: imageSuffix,
    ENV_DIR: resolve(cfg.root || root, cfg.envDir || "env"),
    SERVER_ENV_FILE: cfg.serverEnv || "",
    CLIENT_ENV_FILE: cfg.clientEnv || "env/client.env",
    WEBSITE_ENV_FILE: cfg.websiteEnv || "env/website.env",
    CLIENT_CONTAINER_PORT: clientContainerPort,
    WEBSITE_CONTAINER_PORT: websiteContainerPort,
    GATEWAY_NGINX_TEMPLATE: gatewayNginxTemplate(
      clientDev,
      websiteDev,
      clientMode,
    ),
    GATEWAY_CLIENT_STATIC: "../client/build/client",
    GATEWAY_WEBSITE_STATIC: "../website/dist",
    CLIENT_STATIC_DIR: !anyDev ? "/app/client-static" : "",
    GATEWAY_APP_UPSTREAM:
      clientMode === "nest"
        ? `server:${readEnvFileValue(cfg.dockerEnv, "SERVER_INTERNAL") || "3000"}`
        : `client:${clientContainerPort}`,
    ...extra,
  };

  const viteApiUrl =
    extra.VITE_API_URL || readEnvFileValue(cfg.clientEnv, "VITE_API_URL");
  if (viteApiUrl) env.VITE_API_URL = viteApiUrl;

  vols.server.forEach((v, i) => {
    env[`V_SERVER_${i + 1}`] = v;
  });
  vols.client.forEach((v, i) => {
    env[`V_CLIENT_${i + 1}`] = v;
  });
  (vols.website || []).forEach((v, i) => {
    env[`V_WEBSITE_${i + 1}`] = v;
  });

  return env;
}

export function composeArgs(cfg) {
  const publishFile = writePublishPortsCompose(cfg, cfg.root || root);
  return [
    "compose",
    "--ansi",
    "always",
    "--env-file",
    cfg.dockerEnv,
    "-f",
    cfg.compose,
    "-f",
    publishFile,
  ];
}

export function envBasename(p) {
  return String(p).replace(/^env\//, "");
}

/** Repo-relative path as in environments.json (`env/production/server.env`, not basename). */
export function envRepoRel(p, envDir = "env") {
  const s = String(p || "").replace(/^\.\//, "").trim();
  if (!s) return "";
  if (s.startsWith("env/") || s.includes("/")) return s;
  return `${envDir}/${s}`;
}

/** Env files for selected deploy apps (+ dockerEnv). */
export function envFilesForDeployTarget(cfg, target) {
  const t = target === "api" ? "server" : target === "web" ? "client" : target;
  if (t === "all") {
    return [
      cfg.dockerEnv,
      cfg.serverEnv,
      cfg.clientEnv,
      cfg.websiteEnv,
    ].filter(Boolean);
  }
  if (t === "website") return [cfg.dockerEnv, cfg.websiteEnv].filter(Boolean);
  const out = [cfg.dockerEnv];
  if (t === "server" && cfg.serverEnv) out.push(cfg.serverEnv);
  else if (t === "client" && cfg.clientEnv) out.push(cfg.clientEnv);
  return [...new Set(out.filter(Boolean))];
}

export function listDockerEnvironments() {
  const raw = readConfig();
  return Object.keys(raw.environments || {});
}

export { root as dockerEnvRoot, configPath as dockerEnvConfigPath };
