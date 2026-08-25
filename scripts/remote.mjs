#!/usr/bin/env node
/**
 * Remote Docker control — same ops as local stop/reload/logs/clean, over SSH.
 * Also: pull (git sync), env (sync env + reload).
 *
 * From laptop:
 *   node scripts/remote.mjs --host staging --action stop server
 *   node scripts/remote.mjs --host staging --action env
 *   node scripts/remote.mjs --host staging --action pull
 *   node scripts/remote.mjs --host staging --action logs server
 *
 * On the server (invoked via SSH re-exec for compose ops):
 *   node scripts/remote.mjs --action stop --env staging server
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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
} from "./port-check.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hostsPath = resolve(root, "deploy/hosts.json");

/** Compose actions re-exec on the remote host */
const COMPOSE_ACTIONS = [
  "status",
  "ps",
  "start",
  "reload",
  "restart",
  "stop",
  "logs",
  "clean",
];
/** Laptop-side actions (SSH/scp from this machine) */
const HOST_ACTIONS = ["env", "sync-env", "pull"];
const ACTIONS = [...COMPOSE_ACTIONS, ...HOST_ACTIONS];

const DOCKER_APPS = ["server", "client", "website"];
const GATEWAY = "gateway";
const COMPOSE_TARGETS = [...DOCKER_APPS, GATEWAY];
const INFRA = ["postgres", "redis"];

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function help() {
  const envs = listDockerEnvironments().join("|");
  console.log(`
Usage:
  node scripts/remote.mjs --host <name> --action <action> [services…]
  node scripts/remote.mjs --action <action> --env <${envs || "staging|production"}> [services…]

Compose actions (SSH → docker compose on host):
  status | ps     containers + volumes + images + networks + disk
  start           up -d (+ infra if server)
  reload|restart  up -d --force-recreate
  stop            stop only (containers kept — use clean to remove)
  logs            follow logs (Ctrl+C detaches)
  clean           deep clean: containers / volumes / images / builds / deps (env/ kept)

Host sync actions (from your laptop):
  pull            git sync only (reset --hard origin/<branch>, keep env/)
  env | sync-env  upload env from local → host, then reload containers

Flags:
  --all           all apps / full stack
  --containers --volumes --images --builds --deps   clean layers
  --all-layers    all clean layers at once
  --no-reload     with env: skip container reload after sync

Examples:
  node scripts/remote.mjs --host staging --action pull
  node scripts/remote.mjs --host staging --action env
  node scripts/remote.mjs --host staging --action reload gateway
  node scripts/remote.mjs --host staging --action stop server
`);
}

function expandHome(p) {
  if (!p) return p;
  return p.startsWith("~/") ? resolve(homedir(), p.slice(2)) : p;
}

function readHosts() {
  if (!existsSync(hostsPath)) die(`Missing ${hostsPath}`);
  return JSON.parse(readFileSync(hostsPath, "utf8"));
}

function pickDefaults(obj = {}) {
  const keys = [
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
  // "env" is per-host only — never inherited from top-level defaults
  const out = {};
  for (const key of keys) {
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
    sshKey,
    githubSshKey,
    clientMode,
    forwardAgent,
    dockerEnv: h.dockerEnv || "",
    serverEnv: h.serverEnv || "",
    clientEnv: h.clientEnv || "",
  };
}

function sshOpts(sshKey, { forwardAgent = false } = {}) {
  const opts = [
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    "PreferredAuthentications=publickey",
    "-o",
    "PasswordAuthentication=no",
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
    opts.push("-o", "IdentitiesOnly=yes");
  }
  return opts;
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || root,
    stdio: "inherit",
    env: { ...process.env, ...opts.env },
  });
  if ((r.status ?? 1) !== 0) die(`${cmd} exited ${r.status ?? 1}`);
}

function runCapture(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: opts.cwd || root,
    encoding: "utf8",
    env: { ...process.env, ...opts.env },
  });
  return {
    status: r.status ?? 1,
    out: (r.stdout || "").trim(),
    err: (r.stderr || "").trim(),
  };
}

function ssh(h, remoteCmd, { forwardAgent = false, tty = false } = {}) {
  const args = [...sshOpts(h.sshKey, { forwardAgent })];
  if (tty) args.push("-t");
  args.push(`${h.user}@${h.host}`, remoteCmd);
  run("ssh", args);
}

function scp(h, localFile, remoteFile) {
  run("scp", [
    ...sshOpts(h.sshKey, { forwardAgent: false }),
    localFile,
    `${h.user}@${h.host}:${remoteFile}`,
  ]);
}

function parseArgs(argv) {
  const out = {
    host: null,
    action: null,
    env: null,
    clientMode: null,
    services: [],
    all: false,
    volumes: false,
    containers: false,
    images: false,
    builds: false,
    deps: false,
    noReload: false,
    target: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--host") out.host = argv[++i];
    else if (a === "--action") out.action = argv[++i];
    else if (a === "--env") out.env = argv[++i];
    else if (a === "--client-mode") out.clientMode = argv[++i];
    else if (a === "--target") out.target = argv[++i];
    else if (a === "--all" || a === "all") out.all = true;
    else if (a === "--volumes" || a === "-v") out.volumes = true;
    else if (a === "--containers") out.containers = true;
    else if (a === "--images") out.images = true;
    else if (a === "--builds") out.builds = true;
    else if (a === "--deps") out.deps = true;
    else if (a === "--all-layers") {
      out.containers = out.volumes = out.images = out.builds = out.deps = true;
    }
    else if (a === "--no-reload") out.noReload = true;
    else if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--") continue;
    else if (!a.startsWith("-")) {
      if (!out.action && ACTIONS.includes(a)) out.action = a;
      else if (COMPOSE_TARGETS.includes(a) || INFRA.includes(a)) out.services.push(a);
      else if (a === "all" || a === "*") out.all = true;
      else die(`Unknown arg: ${a}`);
    } else die(`Unknown arg: ${a}`);
  }
  if (out.action === "ps") out.action = "status";
  if (out.action === "restart") out.action = "reload";
  if (out.action === "sync-env") out.action = "env";
  return out;
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function ensureSshAgentEnv() {
  if (process.env.SSH_AUTH_SOCK) return { ...process.env };
  const r = spawnSync("ssh-agent", ["-s"], { encoding: "utf8" });
  if ((r.status ?? 1) !== 0) {
    console.log("⚠️  Could not start ssh-agent — start it manually.");
    return { ...process.env };
  }
  const env = { ...process.env };
  for (const line of String(r.stdout || "").split("\n")) {
    const m = line.match(/^(SSH_AUTH_SOCK|SSH_AGENT_PID)=([^;]+)/);
    if (m) env[m[1]] = m[2];
  }
  if (env.SSH_AUTH_SOCK) console.log("  ssh-agent: started");
  return env;
}

function ensureGithubKeyInAgent(h) {
  if (!h.forwardAgent) return { ...process.env };
  const agentEnv = ensureSshAgentEnv();
  Object.assign(process.env, {
    SSH_AUTH_SOCK: agentEnv.SSH_AUTH_SOCK,
    SSH_AGENT_PID: agentEnv.SSH_AGENT_PID,
  });
  const keyPath = h.githubSshKey ? expandHome(h.githubSshKey) : "";
  if (!keyPath) {
    if (!process.env.SSH_AUTH_SOCK) {
      console.log(
        '⚠️  Set githubSshKey in deploy/hosts.json for git pull (e.g. "~/.ssh/id_ed25519")',
      );
    }
    return agentEnv;
  }
  if (!existsSync(keyPath)) die(`githubSshKey not found: ${h.githubSshKey}`);
  const listed = spawnSync("ssh-add", ["-l"], { encoding: "utf8", env: agentEnv });
  const already =
    (listed.status ?? 1) === 0 &&
    listed.stdout &&
    listed.stdout.includes(keyPath);
  if (!already) {
    console.log(`  githubSshKey: ssh-add ${h.githubSshKey}`);
    const add = spawnSync("ssh-add", [keyPath], {
      stdio: "inherit",
      env: agentEnv,
    });
    if ((add.status ?? 1) !== 0) {
      die(`ssh-add failed for ${h.githubSshKey}`);
    }
  }
  return agentEnv;
}

/** Create host path + env/ — only when we are about to write files (pull / env sync). */
function ensureRemoteDirs(h) {
  const pathQ = shellQuote(h.path);
  const envQ = shellQuote(h.path + "/env");
  if (h.user === "root") {
    ssh(h, `mkdir -p ${pathQ} ${envQ}`);
    return;
  }
  const u = h.user;
  ssh(
    h,
    `set -e
for d in ${pathQ} ${envQ}; do
  if [ ! -d "$d" ]; then
    mkdir -p "$d" 2>/dev/null || { sudo -n mkdir -p "$d" && sudo -n chown '${u}:${u}' "$d"; }
  fi
  if [ -d "$d" ] && [ ! -w "$d" ]; then
    sudo -n chown -R '${u}:${u}' "$d"
  fi
  mkdir -p "$d"
done
`,
  );
}

/** Read-only check: do not mkdir. Status/start/stop/logs need an existing checkout. */
function ensureProjectOnHost(h) {
  const composeFile = `${h.path}/docker/compose.yml`;
  const check = spawnSync(
    "ssh",
    [
      ...sshOpts(h.sshKey),
      `${h.user}@${h.host}`,
      `if [ ! -d ${shellQuote(h.path)} ]; then echo NO_PATH; elif [ ! -f ${shellQuote(composeFile)} ]; then echo NO_PROJECT; else echo OK; fi`,
    ],
    { encoding: "utf8" },
  );
  const out = (check.stdout || "").trim();
  if (out.includes("NO_PATH")) {
    die(
      `No directory ${h.user}@${h.host}:${h.path} — run pnpm remote → Deploy first (this action does not create the path).`,
    );
  }
  if (out.includes("NO_PROJECT")) {
    die(
      `No project at ${h.user}@${h.host}:${h.path} — run pnpm remote → Deploy first.`,
    );
  }
  if ((check.status ?? 1) !== 0 && !out.includes("OK")) {
    die(
      `Cannot access ${h.user}@${h.host}:${h.path} (${(check.stderr || check.stdout || "ssh failed").trim()})`,
    );
  }
}

/** SSH re-exec compose action on the host */
function remoteViaSsh(h, args) {
  const parts = [
    "node",
    "./scripts/remote.mjs",
    "--action",
    args.action,
    "--env",
    h.env,
    "--client-mode",
    h.clientMode,
  ];
  if (args.all) parts.push("--all");
  if (args.volumes) parts.push("--volumes");
  if (args.containers) parts.push("--containers");
  if (args.images) parts.push("--images");
  if (args.builds) parts.push("--builds");
  if (args.deps) parts.push("--deps");
  for (const s of args.services) parts.push(s);

  const remoteCmd = `cd ${shellQuote(h.path)} && ${parts.map(shellQuote).join(" ")}`;
  console.log(`▸ Remote ${args.action} on ${h.name} (${h.user}@${h.host})`);
  ssh(h, remoteCmd, { tty: args.action === "logs" });
}

/**
 * Match origin exactly. Keeps gitignored env/ (laptop-synced secrets).
 */
function gitPullOnHost(h) {
  console.log(`→ git sync ${h.branch} on ${h.name} (reset --hard, keep env/)`);
  ensureRemoteDirs(h);
  if (h.forwardAgent) {
    ensureGithubKeyInAgent(h);
    if (!process.env.SSH_AUTH_SOCK) {
      console.log("⚠️  SSH_AUTH_SOCK unset — git@github.com may fail");
    }
  }
  const b = h.branch;
  ssh(
    h,
    `cd ${shellQuote(h.path)} && git fetch --all --prune && git checkout ${shellQuote(b)} && git reset --hard ${shellQuote(`origin/${b}`)} && git clean -fd -e env -e env/`,
    { forwardAgent: h.forwardAgent },
  );
  console.log("✓ git sync done (env/ kept)");
}

function ensureRemoteFileParent(h, remotePath) {
  const dir = dirname(remotePath);
  const dirQ = shellQuote(dir);
  if (h.user === "root") {
    ssh(h, `mkdir -p ${dirQ}`);
    return;
  }
  const u = h.user;
  ssh(
    h,
    `set -e
if [ ! -d ${dirQ} ]; then
  mkdir -p ${dirQ} 2>/dev/null || { sudo -n mkdir -p ${dirQ} && sudo -n chown '${u}:${u}' ${dirQ}; }
fi
if [ -d ${dirQ} ] && [ ! -w ${dirQ} ]; then
  sudo -n chown -R '${u}:${u}' ${dirQ}
fi
mkdir -p ${dirQ}
`,
  );
}

function syncEnvToHost(h, { force = true } = {}) {
  let cfg;
  try {
    cfg = loadDockerEnvironment(h.env, {
      clientMode: h.clientMode,
      dockerEnv: h.dockerEnv || undefined,
      serverEnv: h.serverEnv || undefined,
      clientEnv: h.clientEnv || undefined,
    });
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
  ensureRemoteDirs(h);

  const relFiles = envFilesForDeployTarget(cfg, "all");
  console.log(
    `→ sync env → ${h.name} (environments.${h.env})  ${relFiles.join(", ")}`,
  );

  let uploaded = 0;
  for (const raw of relFiles) {
    const rel = envRepoRel(raw, cfg.envDir || "env");
    const local = resolve(root, rel);
    const remotePath = `${h.path}/${rel}`;
    if (!force) {
      const exists = runCapture("ssh", [
        ...sshOpts(h.sshKey),
        `${h.user}@${h.host}`,
        `if [ -f ${shellQuote(remotePath)} ]; then echo YES; else echo NO; fi`,
      ]);
      if (exists.out.includes("YES")) {
        console.log(`    ${rel}: exists — skip`);
        continue;
      }
    }
    if (!existsSync(local)) {
      console.log(`    ${rel}: missing on laptop — skip`);
      continue;
    }
    ensureRemoteFileParent(h, remotePath);
    scp(h, local, remotePath);
    console.log(`    ${rel}: ← laptop`);
    uploaded++;
  }
  console.log(uploaded ? `✓ synced ${uploaded} env file(s)` : "✓ no env files to sync");
}

function runHostAction(h, args) {
  console.log(`▸ Remote ${args.action} on ${h.name} (${h.user}@${h.host})`);
  ensureProjectOnHost(h);

  switch (args.action) {
    case "pull": {
      gitPullOnHost(h);
      console.log("✓ pull done (workspace synced; containers unchanged)");
      return;
    }

    case "env": {
      syncEnvToHost(h, { force: true });
      if (args.noReload) {
        console.log("✓ env synced (--no-reload)");
        return;
      }
      if (args.all || !args.services.length) {
        remoteViaSsh(h, { action: "reload", all: true, services: [], volumes: false });
      } else {
        remoteViaSsh(h, {
          action: "reload",
          all: false,
          services: args.services,
          volumes: false,
        });
      }
      console.log("✓ env done (sync + reload)");
      return;
    }

    default:
      die(`Unknown host action: ${args.action}`);
  }
}

function loadCfg(envName, clientMode) {
  try {
    return loadDockerEnvironment(envName, {
      clientMode: clientMode || undefined,
    });
  } catch (err) {
    die(err instanceof Error ? err.message : String(err));
  }
}

function dcBase(cfg) {
  return {
    args: composeArgs(cfg),
    env: composeProcessEnv(cfg, {
      CLIENT_MODE: cfg.clientMode,
      CLIENT_SSR: cfg.clientMode === "ssr" ? "true" : "false",
    }),
  };
}

function runningServices(cfg) {
  const { args, env } = dcBase(cfg);
  const r = runCapture("docker", [...args, "ps", "--status", "running", "--services"], {
    env,
  });
  if (r.status !== 0) return [];
  return r.out.split(/\s+/).filter(Boolean);
}

function allowedApps(cfg) {
  const set = new Set(cfg.services);
  const apps = DOCKER_APPS.filter((s) => {
    if (s === "client" && !clientUsesDockerService(cfg.clientMode)) return false;
    return set.has(s);
  });
  if (set.has("gateway")) apps.push("gateway");
  return apps;
}

function resolveTargets(cfg, args, { forStop = false } = {}) {
  const allowed = new Set(cfg.services);
  if (args.all) {
    if (forStop) {
      const running = runningServices(cfg);
      return running.length ? running : [...cfg.services];
    }
    return allowedApps(cfg);
  }
  if (!args.services.length) {
    die(`Pick services (server|client|website|gateway) or --all`);
  }
  const out = [];
  for (const s of args.services) {
    if (s === "website" && !websiteUsesDockerService(cfg.websiteMode)) {
      if (!allowed.has("gateway")) {
        die(
          `website has no container in this env (gateway serves /) — deploy website then start gateway`,
        );
      }
      out.push("gateway");
      continue;
    }
    if (s === "client" && !clientUsesDockerService(cfg.clientMode)) {
      if (cfg.clientMode === "nest") {
        if (!allowed.has("server")) {
          die(`clientMode=nest: SPA is bind-mounted on Docker server — start server (not client)`);
        }
        out.push("server");
        continue;
      }
      if (!allowed.has("gateway")) {
        die(
          `clientMode=${cfg.clientMode} has no client container — Docker gateway serves /app/`,
        );
      }
      out.push("gateway");
      continue;
    }
    if (!allowed.has(s) && !INFRA.includes(s)) {
      die(`Service "${s}" not in env ${cfg.name} (have: ${cfg.services.join(", ")})`);
    }
    out.push(s);
  }
  return [...new Set(out)];
}

function withInfraIfServer(cfg, apps) {
  const allowed = new Set(cfg.services);
  const infra = INFRA.filter((s) => allowed.has(s));
  if (apps.includes("server")) return [...new Set([...infra, ...apps])];
  return apps;
}

/** Edge nginx — start with any app that is reached through it. */
function withGateway(cfg, apps) {
  if (!cfg.services?.includes("gateway")) return apps;
  if (apps.includes("gateway")) return apps;
  const needs =
    apps.includes("server") ||
    apps.includes("client") ||
    apps.includes("website");
  return needs ? [...apps, "gateway"] : apps;
}

function composeUpArgs(action, targets) {
  const onlyGateway = targets.length === 1 && targets[0] === GATEWAY;
  if (onlyGateway) {
    const base = ["up", "-d", "--no-deps"];
    if (action === "reload") base.push("--force-recreate");
    base.push(GATEWAY);
    return base;
  }
  if (action === "reload") {
    return ["up", "-d", "--force-recreate", ...targets];
  }
  return ["up", "-d", ...targets];
}

function runLocalAction(args) {
  const envName = args.env || process.env.DEPLOY_ENV || "staging";
  const clientMode = args.clientMode
    ? normalizeClientMode(args.clientMode)
    : undefined;
  const cfg = loadCfg(envName, clientMode);
  const { args: base, env } = dcBase(cfg);
  const dc = (...extra) => run("docker", [...base, ...extra], { env });

  console.log(`▸ env=${cfg.name}  clientMode=${cfg.clientMode}  action=${args.action}`);

  switch (args.action) {
    case "status": {
      const project = cfg.projectName || process.env.COMPOSE_PROJECT_NAME || "moon-tailors";
      console.log(`\n── Containers (${project}) ──`);
      dc("ps", "-a");

      const live = runningServices(cfg);
      const allCompose = [...(cfg.services || [])];
      const stopped = allCompose.filter((s) => !live.includes(s));
      console.log(
        live.length
          ? `  running: ${live.join(", ")}`
          : "  running: (none)",
      );
      if (stopped.length) console.log(`  not running: ${stopped.join(", ")}`);

      console.log(`\n── Images (${project}-*) ──`);
      {
        const r = spawnSync(
          "docker",
          [
            "images",
            "--format",
            "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}\t{{.CreatedSince}}",
            "--filter",
            `reference=${project}-*`,
          ],
          { encoding: "utf8" },
        );
        const out = (r.stdout || "").trim();
        console.log(out || "  (none)");
      }

      console.log(`\n── Volumes (${project}_*) ──`);
      {
        const r = spawnSync(
          "docker",
          [
            "volume",
            "ls",
            "--format",
            "table {{.Name}}\t{{.Driver}}\t{{.Scope}}",
            "--filter",
            `name=${project}_`,
          ],
          { encoding: "utf8" },
        );
        const out = (r.stdout || "").trim();
        console.log(out || "  (none)");
      }

      console.log(`\n── Networks ──`);
      {
        const r = spawnSync(
          "docker",
          [
            "network",
            "ls",
            "--format",
            "table {{.Name}}\t{{.Driver}}\t{{.Scope}}",
            "--filter",
            `name=${project}`,
          ],
          { encoding: "utf8" },
        );
        const out = (r.stdout || "").trim();
        console.log(out || "  (none)");
      }

      console.log(`\n── Disk (docker) ──`);
      spawnSync("docker", ["system", "df"], { stdio: "inherit" });

      console.log(`\n✓ status done  env=${cfg.name}  clientMode=${cfg.clientMode}`);
      return;
    }

    case "start": {
      const apps = resolveTargets(cfg, args);
      const targets = withGateway(cfg, withInfraIfServer(cfg, apps));
      const ports = collectHostPorts(cfg, targets, root);
      if (ports.length) {
        console.log(
          `▸ port check (docker.env): ${ports.map((p) => `${p.label}:${p.port}`).join(", ")}`,
        );
        assertHostPortsAvailable(cfg.projectName || "moon-tailors", ports);
      }
      console.log(`→ start: ${targets.join(", ")}`);
      dc(...composeUpArgs("start", targets));
      console.log(`✓ started ${apps.join(", ")}`);
      return;
    }

    case "reload": {
      const apps = resolveTargets(cfg, args);
      const targets = withGateway(cfg, withInfraIfServer(cfg, apps));
      const ports = collectHostPorts(cfg, targets, root);
      if (ports.length) {
        console.log(
          `▸ port check (docker.env): ${ports.map((p) => `${p.label}:${p.port}`).join(", ")}`,
        );
        assertHostPortsAvailable(cfg.projectName || "moon-tailors", ports);
      }
      console.log(`→ reload: ${targets.join(", ")}`);
      dc(...composeUpArgs("reload", targets));
      console.log(`✓ reloaded ${apps.join(", ")}`);
      return;
    }

    case "stop": {
      const targets = resolveTargets(cfg, args, { forStop: true });
      if (!targets.length) {
        console.log("Nothing to stop");
        return;
      }
      const running = new Set(runningServices(cfg));
      const live = targets.filter((s) => running.has(s));
      const dead = targets.filter((s) => !running.has(s));
      if (dead.length) console.log(`Already stopped: ${dead.join(", ")}`);
      if (!live.length) {
        console.log("Nothing running to stop");
        return;
      }
      const toStop = [...live];
      const appsStillUp = DOCKER_APPS.filter(
        (s) => running.has(s) && !live.includes(s),
      );
      if (
        !appsStillUp.length &&
        running.has("gateway") &&
        !toStop.includes("gateway")
      ) {
        toStop.push("gateway");
      }
      console.log(`→ stop: ${toStop.join(", ")}`);
      dc("stop", ...toStop);
      console.log(`✓ stopped ${toStop.join(", ")} (containers kept)`);
      return;
    }

    case "logs": {
      const apps = resolveTargets(cfg, {
        ...args,
        all: args.all || !args.services.length,
        services: args.services.length ? args.services : allowedApps(cfg),
      });
      const running = new Set(runningServices(cfg));
      const live = apps.filter((s) => running.has(s));
      if (!live.length) die(`None of [${apps.join(", ")}] are running`);
      if (live.length < apps.length) {
        console.log(`Following only running: ${live.join(", ")}`);
      }
      console.log(`→ logs -f ${live.join(", ")} (Ctrl+C detaches)`);
      const r = spawnSync(
        "docker",
        [...base, "logs", "-f", "--tail", "100", ...live],
        { cwd: root, stdio: "inherit", env: { ...process.env, ...env } },
      );
      if (r.signal) process.exit(0);
      if ((r.status ?? 1) !== 0) die(`docker logs exited ${r.status ?? 1}`);
      return;
    }

    case "clean": {
      // Same layer model as local pnpm clean (env/ never removed)
      let doContainers = args.containers;
      let doVolumes = args.volumes;
      let doImages = args.images;
      let doBuilds = args.builds;
      let doDeps = args.deps;
      if (!doContainers && !doVolumes && !doImages && !doBuilds && !doDeps) {
        doContainers = true; // safe default
      }

      const CLEAN = {
        server: {
          compose: ["server", "postgres", "redis"],
          volumes: [
            "server_nm",
            "server_pkg_nm",
            "server_contracts_nm",
            "server_logs",
            "postgres_data",
          ],
          images: ["server", "server-dev"],
          builds: ["server/dist"],
          deps: ["server/node_modules"],
        },
        client: {
          compose: ["client"],
          volumes: ["client_nm", "client_pkg_nm", "client_contracts_nm"],
          images: ["client", "client-dev"],
          builds: ["client/build", "client/.react-router"],
          deps: ["client/node_modules"],
        },
        website: {
          compose: ["website"],
          volumes: ["website_nm", "website_pkg_nm"],
          images: ["website", "website-dev"],
          builds: ["website/dist", "website/.astro"],
          deps: ["website/node_modules"],
        },
        gateway: {
          compose: ["gateway"],
          volumes: [],
          images: [],
          builds: [],
          deps: [],
        },
      };

      const project = cfg.projectName || process.env.COMPOSE_PROJECT_NAME || "moon-tailors";
      const apps = args.all
        ? [...DOCKER_APPS, "gateway"]
        : resolveTargets(cfg, args).filter(
            (s) => DOCKER_APPS.includes(s) || s === "gateway",
          );

      console.log(
        `→ clean ${args.all ? "all" : apps.join(",")}` +
          `  layers=${[
            doContainers && "containers",
            doVolumes && "volumes",
            doImages && "images",
            doBuilds && "builds",
            doDeps && "deps",
          ]
            .filter(Boolean)
            .join(",")}`,
      );

      if (args.all && (doContainers || doVolumes || doImages)) {
        const downArgs = ["down", "--remove-orphans"];
        if (doVolumes) downArgs.push("-v");
        if (doImages) downArgs.push("--rmi", "local");
        console.log(`→ compose ${downArgs.join(" ")}`);
        dc(...downArgs);
        console.log("✓ docker stack removed");
      } else if (doContainers || doVolumes || doImages) {
        const composeSvcs = [];
        for (const a of apps) {
          const meta = CLEAN[a];
          if (meta) composeSvcs.push(...meta.compose);
        }
        // Shared edge — remove when this clean covers all Docker apps (or gateway named)
        const dockerLeft = DOCKER_APPS.filter(
          (s) =>
            cfg.services.includes(s) &&
            !apps.includes(s) &&
            !(s === "client" && !clientUsesDockerService(cfg.clientMode)),
        );
        if (apps.includes("gateway") || !dockerLeft.length) {
          composeSvcs.push(...(CLEAN.gateway?.compose ?? ["gateway"]));
        }
        const unique = [...new Set(composeSvcs)];
        if (doContainers && unique.length) {
          console.log(`→ stop+rm: ${unique.join(", ")}`);
          runCapture("docker", [...base, "stop", ...unique], { env });
          try {
            dc("rm", "-f", ...unique);
          } catch {
            /* ignore */
          }
          console.log(`✓ containers removed: ${unique.join(", ")}`);
        }
        if (doVolumes) {
          for (const a of apps) {
            for (const vol of CLEAN[a]?.volumes ?? []) {
              const name = `${project}_${vol}`;
              const r = spawnSync("docker", ["volume", "rm", "-f", name], {
                encoding: "utf8",
              });
              if ((r.status ?? 1) === 0) console.log(`✓ volume ${name}`);
            }
          }
        }
        if (doImages) {
          for (const a of apps) {
            for (const suf of CLEAN[a]?.images ?? []) {
              const name = `${project}-${suf}`;
              const r = spawnSync("docker", ["rmi", "-f", name], {
                encoding: "utf8",
              });
              if ((r.status ?? 1) === 0) console.log(`✓ image ${name}`);
            }
          }
        }
      }

      const rmPath = (rel) => {
        const r = spawnSync("rm", ["-rf", rel], { cwd: root, encoding: "utf8" });
        if ((r.status ?? 1) === 0) console.log(`✓ removed ${rel}`);
      };

      if (doBuilds) {
        for (const a of apps) {
          for (const rel of CLEAN[a]?.builds ?? []) rmPath(rel);
        }
        if (args.all || apps.includes("server") || apps.includes("client")) {
          rmPath("contracts/dist");
        }
        if (args.all) {
          for (const rel of ["website/dist", "website/.astro", ".turbo", ".cache"]) {
            rmPath(rel);
          }
        }
      }

      if (doDeps) {
        for (const a of apps) {
          for (const rel of CLEAN[a]?.deps ?? []) rmPath(rel);
        }
        if (args.all) {
          for (const rel of [
            "node_modules",
            "website/node_modules",
            "contracts/node_modules",
          ]) {
            rmPath(rel);
          }
        }
      }

      console.log("✓ clean done (env/ kept)");
      return;
    }

    default:
      die(`Unknown action: ${args.action}`);
  }
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  help();
  process.exit(0);
}
if (!args.action) {
  help();
  die("Need --action (status|start|reload|stop|logs|clean|env|pull)");
}
if (args.clientMode && !CLIENT_MODES.includes(normalizeClientMode(args.clientMode))) {
  die(`Invalid --client-mode (want ${CLIENT_MODES.join("|")})`);
}

const isHostAction = ["env", "pull"].includes(args.action);

if (args.host) {
  const h = resolveHost(args.host);
  if (args.clientMode) h.clientMode = normalizeClientMode(args.clientMode);
  if (args.env) h.env = args.env;

  if (isHostAction) {
    runHostAction(h, args);
  } else {
    ensureProjectOnHost(h);
    remoteViaSsh(h, args);
  }
} else if (isHostAction) {
  die(`${args.action} needs --host <name> (runs from your laptop over SSH)`);
} else {
  runLocalAction(args);
}
