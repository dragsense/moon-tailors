#!/usr/bin/env node
/**
 * Single deploy entry — deploy/hosts.json only.
 *
 * Remote deploy auto-prepares the host (folder / git / missing env / Docker)
 * and skips steps that already exist.
 *
 *   node scripts/deploy.mjs --host staging --target server
 *   node scripts/deploy.mjs --host staging --target all
 *   node scripts/deploy.mjs --target website
 *   node scripts/deploy.mjs --target client   # CDN mode (hosts.json clientMode=cdn)
 *   node scripts/deploy.mjs --target server --env staging   # on the server
 *
 * clientMode (deploy-only): nginx | ssr | nest | cdn
 * Website / client CDN: provider "manual" | "pages" | "rsync"
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import {
  loadDockerEnvironment,
  composeArgs,
  composeProcessEnv,
  envRepoRel,
  listDockerEnvironments,
  envFilesForDeployTarget,
  normalizeWebsiteMode,
  websiteUsesDockerService,
} from "./docker-env.mjs";
import {
  CLIENT_MODES,
  clientUsesDockerService,
  normalizeClientMode,
} from "./client-mode.mjs";
import {
  collectHostPorts,
  assertHostPortsAvailable,
  remotePortCheckShell,
} from "./port-check.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostsPath = resolve(root, "deploy/hosts.json");
const DEFAULT_FIELDS = [
  "user",
  "host",
  "ip",
  "path",
  "branch",
  "gitUrl",
  "sshKey",
  "githubSshKey",
  "clientMode",
];
// Note: "env" is NOT a shared default — each hosts.<name> must set env explicitly.

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function help() {
  const envs = listDockerEnvironments().join("|");
  console.log(`
Usage:
  node scripts/deploy.mjs --host <name> --target server|client|all [--verbose]
  node scripts/deploy.mjs --target website
  node scripts/deploy.mjs --target client          # when clientMode=cdn
  node scripts/deploy.mjs --target server|client|all [--env ${envs || "staging|production"}] [--client-mode ${CLIENT_MODES.join("|")}]

Remote: auto-creates folder/git/env/Docker only when missing; otherwise skips.
  --verbose   show raw SSH commands
  --sync-env  upload env files from laptop before build (default: keep remote env)
  --no-sync-env   skip env upload (default)
  --prune-images  remove old containers+images before build (default: keep cache)
  --volumes   with --prune-images, also remove volumes (default: keep volumes)
Docker envs: docker/environments.json
clientMode (deploy/hosts.json or --client-mode): nginx | ssr | nest | cdn

  nginx — build SPA; gateway serves /app/ (default; no client container)
  ssr   — Docker Node SSR (react-router-serve); gateway proxies /app/
  nest  — same SPA build as nginx; Nest serves files; gateway proxies /app/ (no client container)
  cdn   — upload SPA files (like website; no client container)

GitHub on the remote: deploy uses ssh -A + hosts.json "githubSshKey"
(loaded into ssh-agent; per-host override allowed for multiple GitHub keys).
VPS login key remains "sshKey". Disable with "forwardAgent": false.

Website / client CDN (no Docker host):
  Default: gateway / website ; /app/ client ; /server/ Nest.
  Choose CDN only for an external static host (Pages, S3, rsync, etc.).
  Set website.mode=cdn in environments.json, or clientMode=cdn / --client-mode cdn.
`);
}

function readHosts() {
  if (!existsSync(hostsPath)) die(`Missing ${hostsPath}`);
  return JSON.parse(readFileSync(hostsPath, "utf8"));
}

function pickDefaults(obj = {}) {
  const out = {};
  for (const key of DEFAULT_FIELDS) {
    if (obj[key] != null && obj[key] !== "") out[key] = obj[key];
  }
  return out;
}

function resolveHost(name) {
  const raw = readHosts();
  const defaults = pickDefaults(raw);
  if (!raw.hosts?.[name]) {
    die(`Unknown host: ${name}\nKnown: ${Object.keys(raw.hosts || {}).join(", ")}`);
  }
  const h = { ...defaults, ...raw.hosts[name] };
  const user = h.user;
  const host = h.host || h.ip;
  const path = h.path;
  const branch = h.branch || "main";
  const env = h.env || name;
  const gitUrl = h.gitUrl || "";
  const sshKey = h.sshKey || raw.sshKey || "";
  const githubSshKey = h.githubSshKey || raw.githubSshKey || "";
  const clientMode = normalizeClientMode(h.clientMode || raw.clientMode || "nginx");
  const forwardAgent = h.forwardAgent !== false && raw.forwardAgent !== false;
  if (!user || !host || !path) die(`Host "${name}" needs user, host, path`);
  return {
    name,
    user,
    host,
    path,
    branch,
    env,
    gitUrl,
    sshKey,
    githubSshKey,
    clientMode,
    forwardAgent,
    dockerEnv: h.dockerEnv || "",
    serverEnv: h.serverEnv || "",
    clientEnv: h.clientEnv || "",
  };
}

function resolveDefaultClientMode() {
  const raw = readHosts();
  return normalizeClientMode(raw.clientMode || "nginx");
}

function printCdnInstructions(label, dist, project) {
  console.log(`
┌─────────────────────────────────────────────────────────────
│  ${label} — CDN mode (no Docker container)
│  Build output: ${dist}
│
│  This mode does NOT deploy to your VPS Docker stack.
│  Upload the static files yourself:
│
│  1) Manual
│     Upload folder "${dist}" to any static host / CDN.
│
│  2) Cloudflare Pages
│     npx wrangler pages deploy ${dist} --project-name ${project}
│
│  3) rsync
│     rsync -avz --delete ${dist}/ USER@HOST:/remote/path/
│
│  To use Docker/gateway instead: set website.mode to docker (website → /) or
│  clientMode nginx (client → /app/) in docker/environments.json, then redeploy.
└─────────────────────────────────────────────────────────────
`);
}

function resolveCdnMeta(kind) {
  // No hosts.json blocks — defaults only; optional env overrides
  if (kind === "website") {
    return {
      dist: process.env.WEBSITE_CDN_DIST || "website/dist",
      project: process.env.WEBSITE_CDN_PROJECT || "moon-tailors-website",
      provider: process.env.WEBSITE_CDN_PROVIDER || "manual",
      user: process.env.WEBSITE_CDN_USER || "",
      host: process.env.WEBSITE_CDN_HOST || "",
      path: process.env.WEBSITE_CDN_PATH || "",
      sshKey: process.env.WEBSITE_CDN_SSH_KEY || "",
    };
  }
  return {
    dist: process.env.CLIENT_CDN_DIST || "client/build/client",
    project: process.env.CLIENT_CDN_PROJECT || "moon-tailors-client",
    provider: process.env.CLIENT_CDN_PROVIDER || "manual",
    user: process.env.CLIENT_CDN_USER || "",
    host: process.env.CLIENT_CDN_HOST || "",
    path: process.env.CLIENT_CDN_PATH || "",
    sshKey: process.env.CLIENT_CDN_SSH_KEY || "",
  };
}

function expandHome(p) {
  if (!p) return p;
  return p.startsWith("~/") ? resolve(homedir(), p.slice(2)) : p;
}

/**
 * SSH options for the VPS key (+ optional agent forwarding for GitHub on the remote).
 * -A lets remote `git pull` use your local GitHub key without copying it to the server.
 */
function sshOpts(sshKey, { forwardAgent = false } = {}) {
  const opts = [
    "-o",
    "StrictHostKeyChecking=accept-new",
    // Don't fall back to password when a key is configured (avoids endless prompts)
    "-o",
    "PreferredAuthentications=publickey",
    "-o",
    "PasswordAuthentication=no",
    // Fail instead of hanging forever on a dead/slow SSH hop
    "-o",
    "ConnectTimeout=15",
    "-o",
    "ServerAliveInterval=5",
    "-o",
    "ServerAliveCountMax=3",
  ];
  if (forwardAgent) opts.push("-A");
  if (sshKey) {
    opts.push("-i", expandHome(sshKey));
    // Only use the given key — ignore agent/other identities that can confuse auth
    opts.push("-o", "IdentitiesOnly=yes");
  }
  return opts;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
  });
  if ((r.status ?? 1) !== 0) die(`${cmd} exited ${r.status ?? 1}`);
}

function runCapture(cmd, args) {
  const r = spawnSync(cmd, args, { cwd: root, encoding: "utf8" });
  if ((r.status ?? 1) !== 0) die((r.stderr || "").trim() || `${cmd} failed`);
  return (r.stdout || "").trim();
}

function useForwardAgent(h) {
  return h.forwardAgent !== false;
}

/** Ensure ssh-agent is running; return env with SSH_AUTH_SOCK / SSH_AGENT_PID if we started it. */
function ensureSshAgentEnv() {
  if (process.env.SSH_AUTH_SOCK) return { ...process.env };

  const r = spawnSync("ssh-agent", ["-s"], { encoding: "utf8" });
  if ((r.status ?? 1) !== 0) {
    console.log("⚠️  Could not start ssh-agent — start it manually, then redeploy.");
    return { ...process.env };
  }
  const env = { ...process.env };
  for (const line of String(r.stdout || "").split("\n")) {
    const m = line.match(/^(SSH_AUTH_SOCK|SSH_AGENT_PID)=([^;]+)/);
    if (m) env[m[1]] = m[2];
  }
  if (env.SSH_AUTH_SOCK && VERBOSE) {
    console.log("       ssh-agent started");
  }
  return env;
}

/**
 * Load the host's githubSshKey into the agent (supports multiple GitHub keys per host).
 * VPS key stays in hosts.json → sshKey; GitHub key is githubSshKey.
 */
function ensureGithubKeyInAgent(h) {
  if (!useForwardAgent(h)) return { ...process.env };

  const agentEnv = ensureSshAgentEnv();
  Object.assign(process.env, {
    SSH_AUTH_SOCK: agentEnv.SSH_AUTH_SOCK,
    SSH_AGENT_PID: agentEnv.SSH_AGENT_PID,
  });

  const keyPath = h.githubSshKey ? expandHome(h.githubSshKey) : "";
  if (!keyPath) {
    if (!process.env.SSH_AUTH_SOCK) {
      console.log(
        "⚠️  No githubSshKey in hosts.json and SSH_AUTH_SOCK unset.",
      );
      console.log(
        '   Set "githubSshKey": "~/.ssh/id_ed25519" (or per-host) then redeploy.\n',
      );
    }
    return agentEnv;
  }

  if (!existsSync(keyPath)) {
    die(`githubSshKey not found: ${h.githubSshKey} → ${keyPath}`);
  }

  // Skip ssh-add if this key path already appears in agent listing
  const listed = spawnSync("ssh-add", ["-l"], {
    encoding: "utf8",
    env: agentEnv,
  });
  let already = false;
  if ((listed.status ?? 1) === 0 && listed.stdout) {
    already = listed.stdout.includes(keyPath);
  }

  if (!already) {
    if (VERBOSE) console.log(`       ssh-add ${h.githubSshKey}`);
    const add = spawnSync("ssh-add", [keyPath], {
      stdio: VERBOSE ? "inherit" : ["ignore", "pipe", "pipe"],
      env: agentEnv,
    });
    if ((add.status ?? 1) !== 0) {
      die(
        `ssh-add failed for ${h.githubSshKey}. Unlock/passphrase? Or run: ssh-add ${keyPath}`,
      );
    }
  }

  return agentEnv;
}

function warnIfNoAgent(h) {
  if (!useForwardAgent(h)) return;
  if (process.env.SSH_AUTH_SOCK) return;
  console.log(
    "  ⚠  SSH_AUTH_SOCK unset — git pull on the host may fail without githubSshKey",
  );
}

let VERBOSE = false;

function step(n, total, title) {
  console.log(`\n  ${n}/${total}  ${title}`);
}

function ok(msg) {
  console.log(`       ✓ ${msg}`);
}

function skip(msg) {
  console.log(`       · ${msg}`);
}

/** Stop leftover SSR/dev client without deleting images (mode switches). */
function removeClientContainerIfPresent(dcEnv) {
  const name = `${dcEnv.COMPOSE_PROJECT_NAME || "moon-tailors"}-client`;
  const inspect = spawnSync("docker", ["inspect", name], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if ((inspect.status ?? 1) !== 0) {
    console.log(`🧹 client container ${name} — none`);
    return;
  }
  console.log(`🧹 remove client container ${name} (keep image)`);
  spawnSync("docker", ["rm", "-f", name], { stdio: "inherit" });
}

function info(msg) {
  console.log(`       ${msg}`);
}

function warn(title, detail) {
  console.log(`       ⚠ ${title}${detail ? `: ${String(detail).split("\n")[0]}` : ""}`);
}

function fail(title, detail) {
  console.error(`\n✗ ${title}`);
  if (detail) console.error(`  ${String(detail).replace(/\n/g, "\n  ")}`);
  process.exit(1);
}

function ssh(h, remoteCmd, { forwardAgent, quiet } = {}) {
  const fwd = forwardAgent ?? useForwardAgent(h);
  const started = Date.now();
  if (VERBOSE) {
    const one = String(remoteCmd).replace(/\s+/g, " ").trim();
    console.log(`       ssh ${h.user}@${h.host}: ${one.slice(0, 120)}`);
  }
  const r = spawnSync(
    "ssh",
    [
      ...sshOpts(h.sshKey, { forwardAgent: fwd }),
      `${h.user}@${h.host}`,
      remoteCmd,
    ],
    {
      cwd: root,
      encoding: "utf8",
      stdio: quiet && !VERBOSE ? ["ignore", "pipe", "pipe"] : "inherit",
    },
  );
  if (VERBOSE) {
    console.log(`       (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  }
  if ((r.status ?? 1) !== 0) {
    const err = (r.stderr || r.stdout || "").trim();
    throw new Error(err || `ssh exited ${r.status ?? 1}`);
  }
  return (r.stdout || "").trim();
}

function scp(h, localFile, remoteFile) {
  if (VERBOSE) console.log(`       scp → ${remoteFile}`);
  const r = spawnSync(
    "scp",
    [
      ...sshOpts(h.sshKey, { forwardAgent: false }),
      localFile,
      `${h.user}@${h.host}:${remoteFile}`,
    ],
    { cwd: root, encoding: "utf8", stdio: VERBOSE ? "inherit" : ["ignore", "pipe", "pipe"] },
  );
  if ((r.status ?? 1) !== 0) {
    die((r.stderr || "").trim() || `scp exited ${r.status ?? 1}`);
  }
}

function sshCapture(h, remoteCmd, { forwardAgent } = {}) {
  const fwd = forwardAgent ?? useForwardAgent(h);
  if (VERBOSE) {
    const one = String(remoteCmd).replace(/\s+/g, " ").trim();
    console.log(`       ssh? ${one.slice(0, 100)}`);
  }
  const r = spawnSync(
    "ssh",
    [
      ...sshOpts(h.sshKey, { forwardAgent: fwd }),
      `${h.user}@${h.host}`,
      remoteCmd,
    ],
    { cwd: root, encoding: "utf8" },
  );
  const out = (r.stdout || "").trim();
  const err = (r.stderr || "").trim();
  if (VERBOSE) {
    console.log(`       → ${out || "(empty)"}` + (err ? ` / ${err.slice(0, 80)}` : ""));
  }
  return { status: r.status ?? 1, out, err };
}

/** mkdir without interactive sudo (sudo without TTY hangs waiting for a password). */
function remoteMkdirCmd(h) {
  const path = h.path;
  const parent = dirname(path);
  if (h.user === "root") {
    return `mkdir -p '${parent}' '${path}'`;
  }
  return `(sudo -n mkdir -p '${parent}' '${path}' && sudo -n chown -R '${h.user}:${h.user}' '${path}') || mkdir -p '${path}'`;
}

/** Ensure `dir` exists and the SSH user can write it (sudo -n + chown on permission denied). */
function remoteEnsureWritableDirCmd(h, dir) {
  if (h.user === "root") {
    return `mkdir -p '${dir}'`;
  }
  const u = h.user;
  return `set -e
if [ ! -d '${dir}' ]; then
  mkdir -p '${dir}' 2>/dev/null || {
    sudo -n mkdir -p '${dir}'
    sudo -n chown '${u}:${u}' '${dir}'
  }
fi
if [ -d '${dir}' ] && [ ! -w '${dir}' ]; then
  sudo -n chown -R '${u}:${u}' '${dir}'
fi
mkdir -p '${dir}'
`;
}

/**
 * Match origin exactly. Keeps gitignored env/ (laptop-synced secrets).
 * Avoids "local changes would be overwritten by merge" from leftover host edits.
 */
function remoteGitSyncCmd(h) {
  const b = h.branch;
  return `cd '${h.path}' && git fetch --all --prune && git checkout '${b}' && git reset --hard 'origin/${b}' && git clean -fd -e env -e 'env/*'`;
}

function parseArgs(argv) {
  const out = {
    host: null,
    target: null,
    env: null,
    clientMode: null,
    verbose: false,
    volumes: false,
    pruneImages: false,
    syncEnv: false,
    start: false,
    migrate: false,
    skipPrepare: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--host") out.host = argv[++i];
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--env") out.env = argv[++i];
    else if (a === "--client-mode") out.clientMode = argv[++i];
    else if (a === "--volumes") out.volumes = true;
    else if (a === "--prune-images") out.pruneImages = true;
    else if (a === "--sync-env") out.syncEnv = true;
    else if (a === "--no-sync-env") out.syncEnv = false;
    else if (a === "--start") out.start = true;
    else if (a === "--no-start") out.start = false;
    else if (a === "--migrate") out.migrate = true;
    else if (a === "--no-migrate") out.migrate = false;
    else if (a === "--skip-prepare") out.skipPrepare = true;
    else if (a === "--verbose" || a === "-v") out.verbose = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (!a.startsWith("-") && !out.target) out.target = a;
    else die(`Unknown arg: ${a}`);
  }
  return out;
}

function composeImageName(dcEnv, service) {
  const project = dcEnv.COMPOSE_PROJECT_NAME || "moon-tailors";
  const suffix = dcEnv.IMAGE_SUFFIX || "";
  return `${project}-${service}${suffix}`;
}

/** After `compose build`, copy static files out of the image (not `compose create --name`). */
function extractImageDir(dcEnv, service, fromPath, outDir) {
  const wipe = spawnSync(
    "bash",
    [
      "-lc",
      `rm -rf ${JSON.stringify(outDir)} 2>/dev/null || sudo -n rm -rf ${JSON.stringify(outDir)}; mkdir -p ${JSON.stringify(outDir)}`,
    ],
    { encoding: "utf8" },
  );
  if ((wipe.status ?? 1) !== 0) {
    fail(`Cannot replace ${outDir}`, wipe.stderr || wipe.stdout || "permission denied");
  }
  mkdirSync(outDir, { recursive: true });
  const name = `moon-tailors-extract-${service}-${process.pid}`;
  const image = composeImageName(dcEnv, service);
  try {
    run("docker", ["create", "--name", name, image], { env: dcEnv });
    run("docker", ["cp", `${name}:${fromPath}`, outDir], { env: dcEnv });
  } finally {
    spawnSync("docker", ["rm", "-f", name], { stdio: "ignore" });
  }
  spawnSync(
    "bash",
    ["-lc", `sudo -n chown -R "$(id -u):$(id -g)" ${JSON.stringify(outDir)} || true`],
    { encoding: "utf8" },
  );
  console.log(`   → ${outDir}`);
}

/** After `compose build client` (target=build), copy SPA onto the host (nginx gateway and/or nest mount). */
function extractClientSpa(_composeBase, dcEnv) {
  extractImageDir(
    dcEnv,
    "client",
    "/app/client/build/client/.",
    resolve(root, "client/build/client"),
  );
}

/** After `compose build website` (target=build), copy dist onto the host for gateway static. */
function extractWebsiteForGateway(_composeBase, dcEnv) {
  extractImageDir(
    dcEnv,
    "website",
    "/app/website/dist/.",
    resolve(root, "website/dist"),
  );
}

function deployLocal(target, envName, clientModeOverride, { start = false, migrate = false } = {}) {
  let cfg;
  try {
    cfg = loadDockerEnvironment(envName, {
      clientMode: clientModeOverride,
      apps: target === "all" ? undefined : [target === "api" ? "server" : target === "web" ? "client" : target],
    });
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }

  const clientMode = cfg.clientMode;
  if (
    (target === "client" || target === "web") &&
    clientMode === "nest"
  ) {
    try {
      cfg = loadDockerEnvironment(envName, {
        clientMode: clientModeOverride,
        apps: ["client", "server"],
      });
    } catch (err) {
      die(err instanceof Error ? err.message : String(err));
    }
  }
  console.log(
    `▸ env=${envName}  clientMode=${clientMode}  start=${start ? "yes" : "no (build only)"}`,
  );

  mkdirSync(resolve(root, "env"), { recursive: true });
  const ensure = (destRel, example) => {
    const dest = resolve(root, destRel);
    const src = resolve(root, "env", example);
    if (!existsSync(dest) && existsSync(src)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
    }
  };
  ensure(cfg.dockerEnv, "docker.env.example");
  ensure(cfg.serverEnv, "server.env.example");
  ensure(cfg.clientEnv, "client.env.example");
  ensure(cfg.websiteEnv, "website.env.example");

  const allowed = new Set(cfg.services);
  const dcEnv = composeProcessEnv(cfg, {
    CLIENT_MODE: clientMode,
    CLIENT_SSR: clientMode === "ssr" ? "true" : "false",
  });
  const base = composeArgs(cfg);
  const dc = (...args) => run("docker", [...base, ...args], { env: dcEnv });

  // On the VPS itself: check ports before building
  {
    const portServices =
      target === "all"
        ? cfg.services.slice()
        : servicesForPortCheck(cfg, target);
    const ports = collectHostPorts(cfg, portServices, root);
    if (ports.length) {
      console.log(
        `▸ port check: ${ports.map((p) => `${p.label}:${p.port}`).join(", ")}`,
      );
      assertHostPortsAvailable(cfg.projectName || "moon-tailors", ports);
    }
  }

  let targets =
    target === "all"
      ? ["server", "client", "website"].filter((t) => {
          if (t === "client" && !clientUsesDockerService(clientMode)) {
            return clientMode === "cdn" || clientMode === "nginx" || clientMode === "nest";
          }
          if (t === "website" && !websiteUsesDockerService(cfg.websiteMode)) {
            return true; // cdn upload or gateway static build
          }
          return allowed.has(t);
        })
      : [target === "api" ? "server" : target === "web" ? "client" : target];

  // CDN — laptop-side static upload (no Docker)
  if (targets.includes("client") && clientMode === "cdn") {
    deployClientCdn();
    targets = targets.filter((t) => t !== "client");
    if (!targets.length) {
      console.log("✅ Deploy complete");
      return;
    }
  }
  if (targets.includes("website") && cfg.websiteMode === "cdn") {
    deployWebsiteCdn();
    targets = targets.filter((t) => t !== "website");
    if (!targets.length) {
      console.log("✅ Deploy complete");
      return;
    }
  }

  const infra = ["postgres", "redis"].filter((s) => allowed.has(s));

  if (targets.includes("client") && clientMode !== "cdn") {
    removeClientContainerIfPresent(dcEnv);
  }

  // nest: build client first so server start can mount the files (do not compile client in the server image).
  if (clientMode === "nest" && targets.includes("client")) {
    console.log(
      "📦 client (nest) — Docker-build SPA; Nest already serves /app/client-static (no server recreate)",
    );
    dc("build", "client");
    extractClientSpa(base, dcEnv);
    targets = targets.filter((t) => t !== "client");
    if (start && !targets.includes("server")) {
      if (allowed.has("gateway")) {
        dc("up", "-d", "--no-deps", "--force-recreate", "gateway");
      }
    }
    if (!targets.length) {
      console.log("✅ Deploy complete");
      return;
    }
  }

  for (const t of targets) {
    if (!allowed.has(t) && !(t === "server" && clientMode === "nest")) {
      const staticSpa =
        t === "client" && !clientUsesDockerService(clientMode);
      const staticSite = t === "website";
      if (!staticSpa && !staticSite) {
        die(`Service "${t}" is excluded for environment "${envName}" (docker/environments.json)`);
      }
    }
    if (t === "server") {
      console.log("📦 server");
      dc("build", "server");
      if (start) {
        if (infra.length) dc("up", "-d", ...infra);
        dc("up", "-d", "--no-deps", "--force-recreate", "server");
        if (allowed.has("gateway")) {
          dc("up", "-d", "--no-deps", "--force-recreate", "gateway");
        }
      }
    } else if (t === "client") {
      if (clientMode === "nginx") {
        console.log(
          "📦 client (nginx) — Docker build SPA; Docker gateway serves /app/ (no client container)",
        );
        dc("build", "client");
        extractClientSpa(base, dcEnv);
        if (start) {
          dc("up", "-d", "--no-deps", "--force-recreate", "gateway");
        }
      } else {
        console.log(`📦 client (${clientMode})`);
        dc("build", "client");
        if (start) {
          dc("up", "-d", "--no-deps", "--force-recreate", "client");
          if (allowed.has("gateway")) {
            dc("up", "-d", "--no-deps", "--force-recreate", "gateway");
          }
        }
      }
    } else if (t === "website") {
      console.log(
        "📦 website (docker) — Docker build static; Docker gateway serves / (no website container)",
      );
      dc("build", "website");
      extractWebsiteForGateway(base, dcEnv);
      if (start) {
        dc("up", "-d", "--no-deps", "--force-recreate", "gateway");
      }
    } else die(`Unknown target: ${t}`);
  }

  if (start && migrate && (target === "server" || target === "all" || target === "api")) {
    console.log("🗃️  migrations…");
    // Same idea as Vivast: find compiled TypeORM data-source under the API package.
    // App package is `server/` (not `backend/`); Nest webpack emits main.js,
    // then `tsc -p tsconfig.typeorm.json` adds dist/database/data-source.js.
    const mig = `set -e
cd /app/server
for p in dist/database/data-source.js dist/src/database/data-source.js; do
  if [ -f "$p" ]; then
    echo "using /app/server/$p"
    node -e "require('./$p').default.initialize().then(ds=>ds.runMigrations().then(()=>{console.log('✓ migrations');return ds.destroy()})).catch(e=>{console.error(e);process.exit(1)})"
    exit 0
  fi
done
if [ -f src/database/data-source.ts ]; then
  echo "using /app/server/src/database/data-source.ts"
  npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts
  exit 0
fi
echo "TypeORM data-source not found under /app/server (expected dist/database/data-source.js)" >&2
exit 1
`;
    const r = spawnSync("docker", [...base, "exec", "server", "sh", "-c", mig], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, ...dcEnv },
    });
    if ((r.status ?? 1) !== 0) {
      fail("Migrations failed", "Fix the data-source or run pnpm migrate later");
    }
  }

  if (start) {
    console.log("✅ Deploy complete (images built + containers started)");
  } else {
    console.log("✅ Deploy complete (images built — not started)");
    console.log("   Start later: pnpm remote → Start");
  }
}

function deployStaticUpload(label, cfg) {
  const dist = resolve(root, cfg.dist);
  if (!existsSync(dist)) die(`Missing build output: ${cfg.dist}`);

  if (cfg.provider === "rsync") {
    if (!cfg.host || !cfg.path) {
      printCdnInstructions(label, cfg.dist, cfg.project);
      die(
        `${label} rsync needs WEBSITE_CDN_HOST+WEBSITE_CDN_PATH or CLIENT_CDN_HOST+CLIENT_CDN_PATH`,
      );
    }
    if (!cfg.user) die(`${label} rsync needs *_CDN_USER`);
    const dest = `${cfg.user}@${cfg.host}:${cfg.path}`;
    console.log(`→ rsync → ${dest}`);
    const args = ["-avz", "--delete", `${dist}/`, dest];
    if (cfg.sshKey) {
      args.unshift("-e", `ssh -i ${expandHome(cfg.sshKey)} -o StrictHostKeyChecking=accept-new`);
    }
    run("rsync", args);
    console.log(`✓ ${label} uploaded`);
    return;
  }

  if (cfg.provider === "pages" || cfg.provider === "cloudflare" || cfg.provider === "wrangler") {
    run("wrangler", ["pages", "deploy", cfg.dist, "--project-name", cfg.project]);
    console.log(`✓ ${label} → Cloudflare Pages`);
    return;
  }

  // manual (default): build done + clear instructions
  printCdnInstructions(label, cfg.dist, cfg.project);
}

function deployWebsiteCdn() {
  const w = resolveCdnMeta("website");
  console.log(`🌐 Website CDN (provider=${w.provider}) — no Docker`);
  console.log("→ Installing @moon-tailors/website deps…");
  run("pnpm", ["install", "--filter", "@moon-tailors/website..."]);
  console.log("→ Building @moon-tailors/website…");
  run("pnpm", ["--filter", "@moon-tailors/website", "build"]);
  deployStaticUpload("Website", w);
}

function deployClientCdn() {
  const c = resolveCdnMeta("client");
  console.log(`☁️  Client CDN (provider=${c.provider}) — no Docker`);
  console.log("→ Installing @moon-tailors/client deps…");
  run("pnpm", ["install", "--filter", "@moon-tailors/client..."]);
  console.log("→ Building @moon-tailors/contracts + @moon-tailors/client (SPA)…");
  run("pnpm", ["--filter", "@moon-tailors/contracts", "build"], {
    env: { ...process.env, CLIENT_SSR: "false" },
  });
  run("pnpm", ["--filter", "@moon-tailors/client", "build"], {
    env: { ...process.env, CLIENT_SSR: "false" },
  });
  deployStaticUpload("Client", c);
}

/** Idempotent: create folder/git/docker only if missing; otherwise skip */
function ensureRemote(h) {
  console.log(`\n▸ Prepare  ${h.name}`);
  console.log(`  host     ${h.user}@${h.host}`);
  console.log(`  path     ${h.path}`);
  console.log(`  branch   ${h.branch}`);
  console.log(`  env      ${h.env}  (stack profile)`);
  if (h.clientEnv || h.serverEnv || h.dockerEnv) {
    const bits = [
      h.dockerEnv && `docker=${h.dockerEnv}`,
      h.clientEnv && `client=${h.clientEnv}`,
      h.serverEnv && `server=${h.serverEnv}`,
    ].filter(Boolean);
    console.log(`  files    ${bits.join("  ")}`);
  }
  if (h.sshKey) console.log(`  ssh key  ${h.sshKey}`);

  if (useForwardAgent(h)) {
    ensureGithubKeyInAgent(h);
    warnIfNoAgent(h);
  }

  // 1) folder
  step(1, 4, "App folder");
  const folderCheck = sshCapture(
    h,
    `if [ -d '${h.path}' ]; then echo EXISTS; else echo MISSING; fi`,
    { forwardAgent: false },
  );
  if (folderCheck.status !== 0) {
    fail(
      "Cannot reach host over SSH",
      `${folderCheck.err || "connection failed"}\nKey: ${h.sshKey || "(none)"}`,
    );
  }
  if (folderCheck.out.includes("MISSING")) {
    info(`creating ${h.path}…`);
    try {
      ssh(h, remoteMkdirCmd(h), { forwardAgent: false, quiet: true });
    } catch (e) {
      fail(
        "Could not create app folder",
        `${e instanceof Error ? e.message : e}\nNeed write access (or passwordless sudo) as ${h.user}.`,
      );
    }
    ok(`created ${h.path}`);
  } else if (folderCheck.out.includes("EXISTS")) {
    skip("already exists");
    try {
      ssh(h, remoteEnsureWritableDirCmd(h, h.path), {
        forwardAgent: false,
        quiet: true,
      });
    } catch (e) {
      fail(
        `Cannot write ${h.path} as ${h.user}`,
        `${e instanceof Error ? e.message : e}\nFix: sudo chown -R ${h.user}:${h.user} ${h.path}\nor passwordless sudo for mkdir/chown.`,
      );
    }
  } else {
    fail("Unexpected folder check", folderCheck.out || "(empty)");
  }

  // 2) git first — env/ is created after clone so it is not in the way
  step(2, 4, "Git repository");
  let gitUrl = h.gitUrl;
  if (!gitUrl) {
    try {
      gitUrl = runCapture("git", ["remote", "get-url", "origin"]);
    } catch {
      fail("No git remote", 'Set "gitUrl" in deploy/hosts.json or git remote origin');
    }
  }
  const shortRepo = gitUrl.replace(/^git@github\.com:/, "").replace(/\.git$/, "");
  const gitCheck = sshCapture(
    h,
    `if [ -d '${h.path}/.git' ]; then echo HAS_GIT; else echo NO_GIT; fi`,
    { forwardAgent: false },
  );
  if (gitCheck.out.includes("HAS_GIT")) {
    info(`pulling ${shortRepo} @ ${h.branch}…`);
    try {
      ssh(h, remoteGitSyncCmd(h), { quiet: true });
      ok(`up to date (${h.branch})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/branch .+ not found|pathspec .+ did not match/i.test(msg)) {
        fail(
          `Branch "${h.branch}" not found on origin`,
          `Repo: ${shortRepo}\nFix: set "branch" in deploy/hosts.json to an existing branch (e.g. main).`,
        );
      }
      fail("Git pull failed", msg);
    }
  } else {
    const empty = sshCapture(
      h,
      `if [ -z "$(ls -A '${h.path}' 2>/dev/null | grep -v '^env$' )" ]; then echo EMPTY; else echo NONEMPTY; fi`,
      { forwardAgent: false },
    );
    if (empty.out.includes("NONEMPTY")) {
      fail(
        "Remote path is not empty and not a git repo",
        h.path,
      );
    }
    info(`cloning ${shortRepo} (branch ${h.branch})…`);
    try {
      ssh(
        h,
        `set -e
if [ -z "$(ls -A '${h.path}' 2>/dev/null)" ]; then
  git clone --branch '${h.branch}' '${gitUrl}' '${h.path}'
else
  tmpdir=$(mktemp -d)
  git clone --branch '${h.branch}' '${gitUrl}' "$tmpdir/repo"
  cp -a "$tmpdir/repo/." '${h.path}/'
  rm -rf "$tmpdir"
fi
`,
        { quiet: true },
      );
      ok(`cloned ${shortRepo}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/Remote branch .+ not found|not found in upstream/i.test(msg)) {
        fail(
          `Branch "${h.branch}" does not exist on GitHub`,
          `Repo: ${shortRepo}\nFix: change hosts.json "branch" to main (or create the branch and push it).`,
        );
      }
      fail("Git clone failed", msg);
    }
  }

  // 3) env dir after git (secrets are uploaded next; not part of the repo)
  try {
    ssh(h, remoteEnsureWritableDirCmd(h, `${h.path}/env`), {
      forwardAgent: false,
      quiet: true,
    });
  } catch (e) {
    fail(
      `Cannot create ${h.path}/env as ${h.user}`,
      `${e instanceof Error ? e.message : e}\nFix: sudo mkdir -p ${h.path}/env && sudo chown -R ${h.user}:${h.user} ${h.path}/env`,
    );
  }

  // 3) docker — already on the host; do not install
  step(3, 4, "Docker");
  info("checking…");
  try {
    ssh(
      h,
      `set -e
command -v docker >/dev/null
docker compose version >/dev/null
docker info >/dev/null
`,
      { forwardAgent: false, quiet: true },
    );
    ok("Docker ready");
  } catch (e) {
    fail(
      "Need docker + Compose v2 (`docker compose version`) on the host",
      e instanceof Error ? e.message : e,
    );
  }
}

/**
 * Env files needed for a deploy target (compose always needs docker.env).
 * @param {object} cfg
 * @param {string} target server|client|website|all
 */
function envFilesForTarget(cfg, target) {
  return envFilesForDeployTarget(cfg, target);
}

/**
 * After git pull: create/update only the env files needed for this target.
 */
function syncEnvToRemote(h, target, { skipDockerEnv = false } = {}) {
  step(4, 4, "Env files");
  let cfg;
  try {
    cfg = loadDockerEnvironment(h.env, {
      clientMode: h.clientMode,
      apps: target === "all" ? undefined : [target],
      dockerEnv: h.dockerEnv || undefined,
      serverEnv: h.serverEnv || undefined,
      clientEnv: h.clientEnv || undefined,
    });
  } catch (err) {
    fail("Bad docker environment", err instanceof Error ? err.message : err);
  }

  let relFiles = envFilesForTarget(cfg, target);
  if (skipDockerEnv && cfg.dockerEnv) {
    const dockerRel = envRepoRel(cfg.dockerEnv, cfg.envDir || "env");
    relFiles = relFiles.filter(
      (raw) => envRepoRel(raw, cfg.envDir || "env") !== dockerRel,
    );
  }
  if (!relFiles.length) {
    skip(`none needed for target=${target}`);
    return;
  }
  info(`environments.${h.env} paths → ${h.path}/`);

  let n = 0;
  for (const raw of relFiles) {
    const rel = envRepoRel(raw, cfg.envDir || "env");
    const local = resolve(root, rel);
    if (!existsSync(local)) {
      skip(`${rel} — missing on laptop (environments.${h.env})`);
      continue;
    }
    const remotePath = `${h.path}/${rel}`;
    const existsRemote = sshCapture(
      h,
      `if [ -f '${remotePath}' ]; then echo YES; else echo NO; fi`,
      { forwardAgent: false },
    );
    const action = existsRemote.out.includes("YES") ? "updated" : "created";
    ssh(h, remoteEnsureWritableDirCmd(h, dirname(remotePath)), {
      forwardAgent: false,
      quiet: true,
    });
    scp(h, local, remotePath);
    ok(`${rel} ${action}`);
    n++;
  }
  if (!n) skip("nothing to copy");
}

function servicesForPortCheck(cfg, target) {
  if (target === "all") return cfg.services.slice();
  const t = target === "api" ? "server" : target === "web" ? "client" : target;
  if (t === "website") {
    if (cfg.websiteMode === "cdn") return [];
    return cfg.services.includes("gateway") ? ["gateway"] : [];
  }
  if (t === "client" && !clientUsesDockerService(cfg.clientMode)) {
    if (cfg.clientMode === "nest") {
      const out = cfg.services.filter(
        (s) => s === "server" || s === "gateway" || ["postgres", "redis"].includes(s),
      );
      return out.length ? out : cfg.services.includes("gateway") ? ["gateway"] : [];
    }
    if (cfg.clientMode === "nginx" && cfg.services.includes("gateway")) {
      return ["gateway"];
    }
    return [];
  }
  const out = cfg.services.filter((s) => {
    if (s === t) return true;
    if (t === "server" && ["postgres", "redis"].includes(s)) {
      return true;
    }
    return false;
  });
  // Deploy/start also recreates gateway for server/client — check GATEWAY_EXPOSE.
  if (
    cfg.services.includes("gateway") &&
    !out.includes("gateway") &&
    (t === "server" || t === "client")
  ) {
    out.push("gateway");
  }
  return out;
}

/** Fail before prune/build if a foreign process holds host ports. */
function assertRemotePortsBeforeDeploy(h, target) {
  let cfg;
  try {
    cfg = loadDockerEnvironment(h.env, {
      clientMode: h.clientMode,
      apps: target === "all" ? undefined : [target],
      dockerEnv: h.dockerEnv || undefined,
      serverEnv: h.serverEnv || undefined,
      clientEnv: h.clientEnv || undefined,
    });
  } catch {
    return;
  }
  const services = servicesForPortCheck(cfg, target);
  const ports = collectHostPorts(cfg, services, root);
  if (!ports.length) return;

  info(
    `checking ports on ${h.host}: ${ports.map((p) => `${p.label}:${p.port}`).join(", ")}…`,
  );
  const script = remotePortCheckShell(cfg.projectName || "moon-tailors", ports);
  try {
    ssh(h, script, { forwardAgent: false, quiet: true });
    ok("ports free (or only our stack)");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(
      "Port already in use — stopped before prune/build",
      msg ||
        "Change GATEWAY_EXPOSE (or other *_EXPOSE) in env/docker.env or stop the other app.",
      );
  }
}

function runRemotePrune(h, target, { volumes = false } = {}) {
  info(`prune old containers+images${volumes ? "+volumes" : ""}…`);
  const pruneParts = [
    "node",
    "./scripts/remote.mjs",
    "--action",
    "clean",
    "--env",
    h.env,
    "--client-mode",
    h.clientMode,
    "--containers",
    "--images",
  ];
  if (volumes) pruneParts.push("--volumes");
  if (target === "all") pruneParts.push("--all");
  else pruneParts.push(target);
  try {
    ssh(h, `cd '${h.path}' && ${pruneParts.map((p) => `'${String(p).replace(/'/g, `'\\''`)}'`).join(" ")}`, {
      quiet: false,
    });
    ok("pruned");
  } catch (e) {
    warn(
      "prune skipped / partial",
      e instanceof Error ? e.message : String(e),
    );
  }
}

function deployRemote(
  h,
  target,
  {
    volumes = false,
    pruneImages = false,
    syncEnv = false,
    start = false,
    migrate = false,
    skipPrepare = false,
  } = {},
) {
  if (!skipPrepare) {
    ensureRemote(h);
  } else {
    skip("folder / git / docker already done this deploy");
  }
  if (syncEnv) {
    syncEnvToRemote(h, target, { skipDockerEnv: skipPrepare });
  } else {
    skip("env sync — keeping remote env files (--sync-env to upload from laptop)");
  }

  console.log(`\n▸ Deploy  ${target}  on ${h.name}`);

  assertRemotePortsBeforeDeploy(h, target);

  if (pruneImages) {
    runRemotePrune(h, target, { volumes });
  } else {
    skip("prune — skipped (opt-in via --prune-images)");
  }

  info(`building ${target}${start ? " + start" : " (no start)"}…`);
  try {
    ssh(
      h,
      `cd '${h.path}' && node ./scripts/deploy.mjs --target '${target}' --env '${h.env}' --client-mode '${h.clientMode}'${start ? " --start" : ""}${migrate ? " --migrate" : ""}`,
      { quiet: false },
    );
  } catch (e) {
    fail("Remote deploy failed", e instanceof Error ? e.message : e);
  }
  console.log(`\n✓ Deploy finished  (${target} → ${h.name})\n`);
}

const args = parseArgs(process.argv.slice(2));
VERBOSE = Boolean(args.verbose);
if (args.help) {
  help();
  process.exit(0);
}

const clientModeArg = args.clientMode
  ? normalizeClientMode(args.clientMode)
  : null;

if (args.target === "website" && !args.host) {
  // Resolve mode from env profile (local always docker handled inside loadDockerEnvironment)
  let mode = "docker";
  try {
    mode = loadDockerEnvironment(
      args.env || process.env.DEPLOY_ENV || "development",
    ).websiteMode;
  } catch {
    /* keep docker */
  }
  if (normalizeWebsiteMode(process.env.WEBSITE_MODE || mode) === "cdn") {
    deployWebsiteCdn();
  } else {
    deployLocal(
      "website",
      args.env || process.env.DEPLOY_ENV || "staging",
      clientModeArg || undefined,
      { start: Boolean(args.start) },
    );
  }
} else if (args.target === "client" && !args.host) {
  const mode = clientModeArg || resolveDefaultClientMode();
  if (mode === "cdn") {
    deployClientCdn();
  } else {
    deployLocal(
      args.target,
      args.env || process.env.DEPLOY_ENV || "staging",
      clientModeArg || undefined,
      { start: Boolean(args.start) },
    );
  }
} else if (args.host) {
  if (!args.target) die("--host requires --target server|client|website|all");
  const h = resolveHost(args.host);
  if (clientModeArg) h.clientMode = clientModeArg;
  if (args.target === "client" && h.clientMode === "cdn") {
    deployClientCdn();
  } else if (args.target === "website") {
    let wMode = "docker";
    try {
      wMode = loadDockerEnvironment(h.env).websiteMode;
    } catch {
      /* */
    }
    if (wMode === "cdn") {
      deployWebsiteCdn();
    } else {
      deployRemote(h, args.target, {
        volumes: Boolean(args.volumes),
        pruneImages: Boolean(args.pruneImages),
        syncEnv: Boolean(args.syncEnv),
        start: Boolean(args.start),
        migrate: Boolean(args.migrate),
        skipPrepare: Boolean(args.skipPrepare),
      });
    }
  } else {
    deployRemote(h, args.target, {
      volumes: Boolean(args.volumes),
      pruneImages: Boolean(args.pruneImages),
      syncEnv: Boolean(args.syncEnv),
      start: Boolean(args.start),
      migrate: Boolean(args.migrate),
      skipPrepare: Boolean(args.skipPrepare),
    });
  }
} else if (args.target) {
  deployLocal(
    args.target,
    args.env || process.env.DEPLOY_ENV || "staging",
    clientModeArg || undefined,
    { start: Boolean(args.start), migrate: Boolean(args.migrate) },
  );
} else {
  help();
  die("Need --target (and --host for remote)");
}
