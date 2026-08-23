#!/usr/bin/env node
/**
 * Template CLI — one entry: pnpm tpl
 *
 *   pnpm tpl              ask what to do
 *   pnpm tpl start        skip the menu (same for stop, deploy, …)
 *
 * Do not use `pnpm setup` — that is a reserved pnpm global command.
 */
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadDockerEnvironment,
  composeArgs,
  composeProcessEnv,
  listEnvApps,
} from "../scripts/docker-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const profileFile = resolve(root, ".profile");
/** Local CLI always uses the `local` docker environment (dev bind mounts). */
const dockerCfg = loadDockerEnvironment("local");
const dockerEnvFile = dockerCfg.dockerEnv;
const composeDev = composeArgs(dockerCfg);
const composeEnv = () => composeProcessEnv(dockerCfg);

const DOCKER_APPS = ["server", "client", "mcp", "website"];
const APPS = ["server", "client", "mcp", "website"];

/** Per-service clean targets + what they share with others */
const CLEAN_META = {
  server: {
    compose: ["server"],
    infra: ["postgres", "redis", "mailpit"],
    imageSuffix: "server-dev",
    volumes: [
      "server_nm",
      "server_pkg_nm",
      "server_contracts_nm",
      "uploads",
      "postgres_data",
    ],
    builds: ["server/dist"],
    nodeModules: ["server/node_modules"],
    env: ["server.env"],
    needsContracts: true,
  },
  client: {
    compose: ["client"],
    infra: [],
    imageSuffix: "client-dev",
    volumes: ["client_nm", "client_pkg_nm", "client_contracts_nm"],
    builds: ["client/build", "client/.react-router"],
    nodeModules: ["client/node_modules"],
    env: ["client.env"],
    needsContracts: true,
  },
  mcp: {
    compose: ["mcp"],
    infra: [],
    imageSuffix: "mcp-dev",
    volumes: ["mcp_nm", "mcp_pkg_nm"],
    builds: ["mcp/dist"],
    nodeModules: ["mcp/node_modules"],
    env: ["mcp.env"],
    needsContracts: false,
  },
  website: {
    compose: ["website"],
    infra: [],
    imageSuffix: "-website",
    volumes: ["website_nm", "website_pkg_nm"],
    builds: ["website/dist", "website/.astro"],
    nodeModules: ["website/node_modules"],
    env: ["website.env"],
    needsContracts: false,
  },
  gateway: {
    compose: ["gateway"],
    infra: [],
    imageSuffix: "",
    volumes: [],
    builds: [],
    nodeModules: [],
    env: [],
    needsContracts: false,
  },
};

/** pnpm --filter for each app (`...` = include workspace deps like contracts) */
const PNPM_FILTER = {
  server: "@template/server...",
  client: "@template/client...",
  mcp: "@template/mcp",
  website: "@template/website",
};

const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

const logColor = {
  server: c.magenta,
  client: c.cyan,
  mcp: c.green,
  website: c.yellow,
  gateway: c.cyan,
  postgres: c.green,
  redis: c.red,
  mailpit: c.yellow,
};

/**
 * Tint compose service prefix only — Nest ConsoleLogger already colors levels.
 * Match container name (`template-server`), never the message body.
 */
function colorizeComposeLogLine(raw) {
  const m = String(raw).match(/^(\S+)\s+\|\s?(.*)$/);
  if (!m) return raw;

  const container = m[1].toLowerCase();
  let svcColor;
  for (const [svc, color] of Object.entries(logColor)) {
    if (container === svc || container.endsWith(`-${svc}`)) {
      svcColor = color;
      break;
    }
  }
  if (!svcColor) return raw;
  return `${svcColor}${m[1]}${c.reset}  | ${m[2]}`;
}

/** Preset menus for setup / start profile — use pickApps (same as run/restart/deploy) */

const DEPLOY_TARGETS = ["server", "client", "mcp", "website"];

const hostsJson = resolve(root, "deploy/hosts.json");

const ACTION_PRESETS = [
  { key: "1", label: "Bootstrap (install + images, no start)", cmd: "setup" },
  { key: "2", label: "Start", cmd: "start" },
  { key: "3", label: "Reload services", cmd: "restart" },
  { key: "4", label: "Stop (keep containers)", cmd: "stop" },
  { key: "5", label: "Logs", cmd: "logs" },
  { key: "6", label: "Build", cmd: "build" },
  { key: "7", label: "Add npm package", cmd: "pkg" },
  { key: "8", label: "Migrate", cmd: "migrate" },
  { key: "9", label: "Remote (SSH: deploy / control host)", cmd: "remote" },
  { key: "10", label: "Clean", cmd: "clean" },
];

const REMOTE_ACTION_PRESETS = [
  { key: "1", label: "Status (containers / volumes / images)", cmd: "status" },
  { key: "2", label: "Deploy (pull + build; env/prune opt-in)", cmd: "deploy" },
  { key: "3", label: "Start", cmd: "start" },
  { key: "4", label: "Reload (sync env + recreate — same images)", cmd: "env" },
  { key: "5", label: "Stop (keep containers)", cmd: "stop" },
  { key: "6", label: "Logs", cmd: "logs" },
  { key: "7", label: "Clean", cmd: "clean" },
  {
    key: "8",
    label: "Pull (git sync only — scripts/workspace, keep env)",
    cmd: "pull",
  },
];

function help() {
  console.log(`
${c.cyan}${c.bold}template${c.reset} — one menu, or direct scripts

  ${c.cyan}pnpm tpl${c.reset}                 ask what to do
  ${c.cyan}pnpm bootstrap|start|reload|stop|logs|build|add-pkg|migrate|remote|clean${c.reset}

${c.dim}Do not use \`pnpm setup\`, \`pnpm restart\`, \`pnpm pkg\`, or \`pnpm deploy\` — reserved by pnpm/npm. Use bootstrap / reload / add-pkg / remote.${c.reset}

Config: ${c.dim}deploy/hosts.json${c.reset} · Profile: ${c.dim}.profile${c.reset}
  Start detaches · Logs follow (Ctrl+C keeps containers) · Stop keeps containers
  Remote menu: deploy / status / start / reload / stop / logs / clean / pull
Docs: docs/LOCAL.md · docs/ENV.md · docs/DEPLOY.md
`);
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolveAsk) => {
    rl.question(question, (answer) => {
      rl.close();
      resolveAsk(String(answer || "").trim());
    });
  });
}

async function pickPreset(title, presets) {
  console.log(`\n${c.bold}${title}${c.reset}\n`);
  for (const p of presets) {
    console.log(`  ${c.cyan}${p.key}${c.reset}) ${p.label}`);
  }
  console.log();
  const choice = await ask(`${c.cyan}Choose [1-${presets.length}]:${c.reset} `);
  const preset = presets.find((p) => p.key === choice);
  if (!preset) throw new Error(`Invalid choice: ${choice}`);
  return preset;
}

function servicesFromFlags(argv) {
  const picked = APPS.filter((s) => argv.includes(`--${s}`));
  if (argv.includes("--all")) return [...APPS];
  return picked;
}

async function resolveServices(argv, { interactiveTitle } = {}) {
  const fromFlags = servicesFromFlags(argv);
  if (fromFlags.length) return fromFlags;
  return pickApps(interactiveTitle ?? "Which services?");
}

function readProfile() {
  if (!existsSync(profileFile)) return null;
  const text = readFileSync(profileFile, "utf8");
  const line = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && l.startsWith("SERVICES="));
  if (!line) return null;
  const value = line.slice("SERVICES=".length).trim();
  const services = value
    .split(",")
    .map((s) => s.trim())
    .filter((s) => APPS.includes(s));
  return services.length ? services : null;
}

/** App folders that can be hidden in the Cursor/VS Code explorer from .profile. */
const EXPLORER_APPS = ["server", "client", "mcp", "website"];

/** Exclude keys this template manages (cleared on each sync). */
const EXPLORER_MANAGED_KEYS = [
  ...EXPLORER_APPS,
  "contracts",
  "docker",
  "env",
  "env/**/*server*",
  "env/**/*client*",
  "env/**/*mcp*",
  "env/**/*docker*",
  "docker/server.Dockerfile",
  "docker/client.Dockerfile",
  "docker/mcp.Dockerfile",
];

/**
 * Hide app folders / env files / docker files not in the work profile.
 * Does not delete anything — only Explorer/search visibility.
 * Pass null/empty to show everything again.
 */
function syncExplorerVisibility(services, { quiet = false } = {}) {
  const vscodeDir = resolve(root, ".vscode");
  mkdirSync(vscodeDir, { recursive: true });
  const settingsPath = resolve(vscodeDir, "settings.json");

  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      settings = {};
    }
  }

  const showAll = !Array.isArray(services) || services.length === 0;
  const selected = new Set(showAll ? EXPLORER_APPS : services);
  const showContracts =
    showAll || selected.has("server") || selected.has("client");
  const needsDocker =
    showAll ||
    selected.has("server") ||
    selected.has("client") ||
    selected.has("mcp");

  const filesExclude = { ...(settings["files.exclude"] || {}) };
  const searchExclude = { ...(settings["search.exclude"] || {}) };

  for (const key of EXPLORER_MANAGED_KEYS) {
    delete filesExclude[key];
    delete searchExclude[key];
  }

  const hidden = [];
  const hide = (key, label = key) => {
    filesExclude[key] = true;
    searchExclude[key] = true;
    if (!hidden.includes(label)) hidden.push(label);
  };

  for (const app of EXPLORER_APPS) {
    if (!selected.has(app)) hide(app);
  }
  if (!showContracts) hide("contracts");

  if (!needsDocker) {
    hide("docker");
    hide("env");
  } else {
    // Keep docker/ folder (compose + environments.json), hide irrelevant Dockerfiles
    if (!selected.has("server")) hide("docker/server.Dockerfile");
    if (!selected.has("client")) hide("docker/client.Dockerfile");
    if (!selected.has("mcp")) hide("docker/mcp.Dockerfile");

    if (!selected.has("server")) hide("env/**/*server*", "env/*server*");
    if (!selected.has("client")) hide("env/**/*client*", "env/*client*");
    if (!selected.has("mcp")) hide("env/**/*mcp*", "env/*mcp*");
  }

  settings["files.exclude"] = filesExclude;
  settings["search.exclude"] = searchExclude;

  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");

  if (!quiet) {
    if (hidden.length) {
      console.log(
        `${c.dim}Explorer: hiding ${hidden.join(", ")} (not in .profile)${c.reset}`,
      );
    } else {
      console.log(`${c.dim}Explorer: showing all app folders${c.reset}`);
    }
  }
}

function writeProfile(services) {
  writeFileSync(
    profileFile,
    `# Local work profile (gitignored). Used by pnpm tpl → Start.\nSERVICES=${services.join(",")}\n`,
    "utf8",
  );
  console.log(`${c.green}✓ profile saved${c.reset}  ${c.dim}.profile → ${services.join(", ")}${c.reset}`);
  syncExplorerVisibility(services);
}

function clearProfileFile({ quiet = false } = {}) {
  if (!existsSync(profileFile)) return;
  rmSync(profileFile, { force: true });
  if (!quiet) console.log(`${c.green}✓ .profile removed${c.reset}`);
  syncExplorerVisibility(null, { quiet });
}

function ensureEnvForServices(services, { quiet = false } = {}) {
  mkdirSync(resolve(root, "env"), { recursive: true });
  const pairs = [];

  const walk = (rel) => {
    const dir = resolve(root, rel);
    if (!existsSync(dir)) return;
    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      const child = `${rel}/${ent.name}`;
      if (ent.isDirectory()) walk(child);
      else if (ent.name.endsWith(".env.example")) {
        pairs.push([child, child.replace(/\.example$/, "")]);
      }
    }
  };
  walk("env");

  for (const [from, to] of pairs) {
    if (to === "env/server.env" && !services.includes("server")) continue;
    if (to === "env/client.env" && !services.includes("client")) continue;
    if (to === "env/mcp.env" && !services.includes("mcp")) continue;
    if (to === "env/website.env" && !services.includes("website")) continue;
    const dest = resolve(root, to);
    const src = resolve(root, from);
    if (existsSync(dest)) {
      if (!quiet) console.log(`${c.dim}skip ${to}${c.reset}`);
      continue;
    }
    if (!existsSync(src)) continue;
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
    console.log(`${c.green}created ${to}${c.reset}`);
  }
}

function run(command, args, label = "run", extraEnv = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: "1", ...extraEnv },
      stdio: ["inherit", "pipe", "pipe"],
    });
    const prefix = `${c.dim}[${label}]${c.reset} `;
    const pipe = (buf, toErr = false) => {
      for (const line of String(buf).split(/\r?\n/).filter(Boolean)) {
        (toErr ? console.error : console.log)(prefix + line);
      }
    };
    child.stdout.on("data", (b) => pipe(b));
    child.stderr.on("data", (b) => pipe(b, true));
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`${command} exited ${code}`));
    });
  });
}

function runDocker(args, label = "docker") {
  return run("docker", [...composeDev, ...args], label, composeEnv());
}

async function requireDocker() {
  await new Promise((resolvePromise, reject) => {
    const child = spawn("docker", ["info"], { cwd: root, stdio: "ignore" });
    child.on("exit", (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error("Docker is not running — start Docker Desktop"));
    });
  });
}

/** Follow compose logs; Ctrl+C only detaches — never stops containers. */
function followLogs(services = ["server"]) {
  return new Promise((resolvePromise) => {
    let done = false;
    const child = spawn(
      "docker",
      [...composeDev, "logs", "-f", "--tail", "100", ...services],
      { cwd: root, env: { ...process.env, FORCE_COLOR: "1", ...composeEnv() } },
    );

    const paint = (buf) => {
      for (const raw of String(buf).split(/\r?\n/).filter(Boolean)) {
        console.log(colorizeComposeLogLine(raw));
      }
    };
    child.stdout.on("data", paint);
    child.stderr.on("data", paint);

    const finish = async () => {
      if (done) return;
      done = true;
      try {
        child.kill("SIGTERM");
      } catch {
        /* ignore */
      }
      console.log(`
${c.yellow}▸ logs detached${c.reset}
  ${c.cyan}pnpm logs${c.reset}    follow again
  ${c.cyan}pnpm start${c.reset}   start services
  ${c.cyan}pnpm stop${c.reset}    stop services
`);
      resolvePromise();
    };

    for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
      process.once(sig, () => {
        finish().finally(() => process.exit(0));
      });
    }
    child.on("exit", () => {
      if (!done) finish();
    });
  });
}

/** Running compose service names (empty if none / compose fails). */
function runningComposeServices() {
  const r = spawnSync(
    "docker",
    [...composeDev, "ps", "--status", "running", "--services"],
    {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...composeEnv() },
    },
  );
  if ((r.status ?? 1) !== 0) return [];
  return String(r.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const serviceUrls = {
  server: "  Server  → http://localhost:8088/server/api/  · Scalar http://localhost:8088/server/api/docs",
  client: "  Client  → http://localhost:8088/app/",
  mcp: "  MCP     → http://localhost:8088/mcp/",
  website: "  Website → http://localhost:8088/",
  gateway: "  Gateway → http://localhost:8088  (/ · /app/ · /server/ · /mailpit/ · /hls/)",
};

/** Services listed after --add (can repeat: --add server --add mcp) */
function servicesFromAddFlags(argv) {
  const out = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--add" && argv[i + 1] && APPS.includes(argv[i + 1])) {
      out.push(argv[i + 1]);
      i++;
    } else if (argv[i].startsWith("--add=") ) {
      const name = argv[i].slice("--add=".length);
      if (APPS.includes(name)) out.push(name);
    }
  }
  return [...new Set(out)];
}

function mergeServices(existing, added) {
  return [...new Set([...(existing ?? []), ...added])];
}

async function resolveSetupServices(argv) {
  const existing = readProfile();
  const toAdd = servicesFromAddFlags(argv);

  // pnpm bootstrap --add server [--add mcp]
  if (toAdd.length) {
    if (!existing?.length) {
      console.log(
        `${c.yellow}No profile yet — treating --add as initial selection${c.reset}`,
      );
      return { services: toAdd, onlyInstallBuild: toAdd };
    }
    const merged = mergeServices(existing, toAdd);
    const fresh = toAdd.filter((s) => !existing.includes(s));
    if (!fresh.length) {
      console.log(
        `${c.dim}Already in profile:${c.reset} ${toAdd.join(", ")} — will reinstall/rebuild`,
      );
      return { services: merged, onlyInstallBuild: toAdd };
    }
    console.log(`${c.dim}Current profile:${c.reset} ${existing.join(", ")}`);
    console.log(`${c.green}Adding:${c.reset} ${fresh.join(", ")}`);
    return { services: merged, onlyInstallBuild: fresh };
  }

  // Flags without --add replace profile (e.g. --all, --server --client)
  const fromFlags = servicesFromFlags(argv);
  if (fromFlags.length) {
    return { services: fromFlags, onlyInstallBuild: fromFlags };
  }

  // Interactive — if profile exists, offer add vs replace
  if (existing?.length) {
    console.log(`${c.dim}Current profile:${c.reset} ${existing.join(", ")}\n`);
    console.log(`  ${c.cyan}1${c.reset}) Add more services to profile`);
    console.log(`  ${c.cyan}2${c.reset}) Replace profile (choose a new set)`);
    console.log();
    const mode = await ask(`${c.cyan}Choose [1-2]:${c.reset} `);

    if (mode === "1") {
      const available = APPS.filter((s) => !existing.includes(s));
      if (!available.length) {
        console.log(
          `${c.dim}Profile already has everything:${c.reset} ${existing.join(", ")}`,
        );
        return { services: existing, onlyInstallBuild: [] };
      }
      console.log(`\n${c.dim}Already have: ${existing.join(", ")}${c.reset}`);
      const added = await pickApps("Which services to add?", {
        options: available,
      });
      const fresh = added.filter((s) => !existing.includes(s));
      if (!fresh.length) {
        console.log(`${c.yellow}Nothing new selected${c.reset}`);
        return { services: existing, onlyInstallBuild: [] };
      }
      return {
        services: mergeServices(existing, fresh),
        onlyInstallBuild: fresh,
      };
    }
  }

  const services = await resolveServices(argv, {
    interactiveTitle: "What do you want to set up?",
  });
  return { services, onlyInstallBuild: services };
}

async function installForServices(services) {
  if (!services.length) {
    console.log(`${c.dim}Nothing new to install${c.reset}`);
    return;
  }
  const filters = [
    ...new Set(services.map((s) => PNPM_FILTER[s]).filter(Boolean)),
  ];
  console.log(
    `\n${c.green}▸ Installing packages…${c.reset} ${c.dim}${filters.join(" ")}${c.reset}`,
  );
  const args = ["install"];
  for (const f of filters) {
    args.push("--filter", f);
  }
  await run("pnpm", args, "pnpm");
  console.log(`${c.green}✓ packages installed${c.reset}`);
}

/**
 * Host `pnpm add` updates bind-mounted package.json/lockfile, but Docker
 * named volumes (`*_pkg_nm`) still hold the old node_modules. Re-run install
 * inside the service container / compose run so those volumes catch up.
 */
async function syncDockerNodeModules(serviceKey) {
  if (!DOCKER_APPS.includes(serviceKey)) return false;
  const filter = PNPM_FILTER[serviceKey];
  if (!filter) return false;

  try {
    await requireDocker();
  } catch {
    console.log(
      `${c.dim}Docker not running — skipped volume sync (host install only)${c.reset}`,
    );
    return false;
  }

  const running = runningComposeServices();
  console.log(
    `\n${c.green}▸ Syncing Docker node_modules volume…${c.reset} ${c.dim}${serviceKey}${c.reset}`,
  );

  try {
    if (running.includes(serviceKey)) {
      await runDocker(
        ["exec", "-T", serviceKey, "pnpm", "install", "--filter", filter],
        "docker-sync",
      );
    } else {
      // Attach the same named volumes even if the app isn't running.
      await runDocker(
        [
          "run",
          "--rm",
          "--no-deps",
          "--entrypoint",
          "pnpm",
          serviceKey,
          "install",
          "--filter",
          filter,
        ],
        "docker-sync",
      );
    }
    console.log(`${c.green}✓ Docker node_modules synced${c.reset}`);
    return true;
  } catch (err) {
    console.log(
      `${c.yellow}⚠ Docker volume sync failed${c.reset} — ${err.message}`,
    );
    console.log(
      `${c.dim}Retry with:${c.reset} ${c.cyan}pnpm bootstrap --add ${serviceKey}${c.reset}`,
    );
    return false;
  }
}

function ensureDockerEnvForCompose() {
  const dest = resolve(root, dockerEnvFile);
  const src = resolve(root, "env/docker.env.example");
  if (!existsSync(dest) && existsSync(src)) {
    mkdirSync(resolve(root, "env"), { recursive: true });
    copyFileSync(src, dest);
  }
}

function dockerImageExists(image) {
  return new Promise((resolveExists) => {
    const child = spawn("docker", ["image", "inspect", image], {
      cwd: root,
      stdio: "ignore",
    });
    child.on("exit", (code) => resolveExists(code === 0));
  });
}

/** Remove dirs that may be root-owned (created inside Docker). Never pulls. Never sudo. */
async function removePathForce(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) return false;

  try {
    rmSync(p, { recursive: true, force: true });
    return true;
  } catch {
    // Prefer images already on the machine — do NOT pull, do NOT sudo
    const localImages = [
      "node:22-alpine",
      "node:22",
      "nginx:alpine",
      "alpine:latest",
      "alpine",
      "busybox:latest",
      "busybox",
    ];
    // Also try any already-cached *alpine* / busybox tag
    try {
      const listed = spawnSync(
        "docker",
        ["images", "--format", "{{.Repository}}:{{.Tag}}"],
        { encoding: "utf8" },
      );
      if ((listed.status ?? 1) === 0) {
        for (const line of (listed.stdout || "").split("\n")) {
          const tag = line.trim();
          if (!tag || tag.endsWith(":<none>")) continue;
          if (/alpine|busybox|node/i.test(tag) && !localImages.includes(tag)) {
            localImages.push(tag);
          }
        }
      }
    } catch {
      /* ignore */
    }

    for (const image of localImages) {
      if (!(await dockerImageExists(image))) continue;
      try {
        await run(
          "docker",
          [
            "run",
            "--rm",
            "--user",
            "0:0",
            "--entrypoint",
            "rm",
            "-v",
            `${root}:/work`,
            image,
            "-rf",
            `/work/${rel}`,
          ],
          "docker",
        );
        if (!existsSync(p)) return true;
      } catch {
        /* try next image */
      }
    }

    console.error(
      `${c.yellow}could not remove ${rel}${c.reset} (likely root-owned from Docker).\n` +
        `  Fix: ${c.cyan}sudo rm -rf ${rel}${c.reset}`,
    );
    return false;
  }
}

function getComposeProjectName() {
  const envPath = resolve(root, dockerEnvFile);
  if (existsSync(envPath)) {
    const m = readFileSync(envPath, "utf8").match(/^COMPOSE_PROJECT_NAME=(.+)$/m);
    if (m?.[1]) return m[1].trim();
  }
  return process.env.COMPOSE_PROJECT_NAME || "template";
}

function remainingNeedsContracts(remaining) {
  return remaining.some((s) => CLEAN_META[s]?.needsContracts);
}

function remainingNeedsDocker(remaining) {
  return remaining.some((s) => DOCKER_APPS.includes(s));
}

async function dockerRmi(image, { quiet } = {}) {
  if (!(await dockerImageExists(image))) return;
  try {
    await run("docker", ["rmi", "-f", image], "docker");
    if (!quiet) console.log(`${c.green}✓ image removed${c.reset}  ${image}`);
  } catch {
    if (!quiet) console.log(`${c.dim}skip image ${image}${c.reset}`);
  }
}

async function dockerVolumeRm(name, { quiet } = {}) {
  try {
    const r = spawnSync("docker", ["volume", "inspect", name], {
      encoding: "utf8",
    });
    if ((r.status ?? 1) !== 0) return;
    await run("docker", ["volume", "rm", "-f", name], "docker");
    if (!quiet) console.log(`${c.green}✓ volume removed${c.reset}  ${name}`);
  } catch {
    if (!quiet) console.log(`${c.dim}skip volume ${name}${c.reset}`);
  }
}

/**
 * Clean selected services only. Shared things (contracts, root node_modules,
 * docker.env, node:22-alpine) stay if any remaining profile service still needs them.
 */
async function cleanCmd(argv, { quiet = false } = {}) {
  // Named apps only (ignore --all here) — --all alone means full stack wipe
  const named = [
    ...new Set(argv.filter((a) => APPS.includes(a) || a === "gateway")),
  ];
  const wantsFull =
    argv.includes("--all") ||
    argv.includes("all") ||
    (argv.includes("--docker") && argv.includes("--profile"));

  if (wantsFull && !named.length) {
    return cleanFull(argv, { quiet });
  }

  const profile = readProfile() ?? [];

  let toClean = named;

  let doContainers = true;
  let doVolumes = false;
  let doImages = true;
  let doBuilds = true;
  let doDeps = false;

  if (!toClean.length) {
    // Leftovers can be cleaned without being in profile (incl. gateway)
    toClean = await pickApps("What do you want to remove?", {
      options: [...APPS, "gateway"],
    });

    const layers = await pickCleanLayers();
    doContainers = layers.containers;
    doVolumes = layers.volumes;
    doImages = layers.images;
    doBuilds = layers.builds;
    doDeps = layers.deps;
  } else {
    doContainers = !argv.includes("--no-docker") && !argv.includes("--no-containers");
    doVolumes = argv.includes("--volumes") || argv.includes("--all-layers");
    doImages = !argv.includes("--no-images") && !argv.includes("--no-docker");
    doBuilds = !argv.includes("--no-builds");
    doDeps = argv.includes("--deps") || argv.includes("--all-layers");
  }

  const remaining = profile.filter((s) => !toClean.includes(s));
  await cleanSelected(toClean, remaining, {
    doContainers,
    doVolumes,
    doImages,
    doBuilds,
    doDeps,
    updateProfile: true,
    quiet,
  });
}

const CLEAN_LAYER_KEYS = ["containers", "volumes", "images", "builds", "deps"];

/** Multi-select what to wipe (env files are never offered / never removed) */
async function pickCleanLayers() {
  const labels = {
    containers: "containers",
    volumes: "volumes",
    images: "images",
    builds: "builds (dist/build)",
    deps: "node_modules",
  };

  console.log(`\n${c.bold}How much to remove?${c.reset} ${c.dim}(env files are never removed)${c.reset}\n`);
  CLEAN_LAYER_KEYS.forEach((key, i) => {
    console.log(`  ${c.cyan}${i + 1}${c.reset}) ${labels[key]}`);
  });
  console.log(`  ${c.cyan}all${c.reset}) containers + volumes + images + builds + node_modules`);
  console.log(`\n${c.dim}Examples: 1  ·  1,3  ·  2,3  ·  all${c.reset}\n`);

  const raw = await ask(`${c.cyan}Choose:${c.reset} `);
  const tokens = raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!tokens.length) throw new Error("Pick at least one");

  if (tokens.some((t) => t === "all" || t === "*")) {
    return {
      containers: true,
      volumes: true,
      images: true,
      builds: true,
      deps: true,
    };
  }

  const picked = new Set();
  for (const t of tokens) {
    if (CLEAN_LAYER_KEYS.includes(t)) {
      picked.add(t);
      continue;
    }
    const n = Number(t);
    if (Number.isInteger(n) && n >= 1 && n <= CLEAN_LAYER_KEYS.length) {
      picked.add(CLEAN_LAYER_KEYS[n - 1]);
      continue;
    }
    throw new Error(`Unknown choice: ${t}`);
  }

  return {
    containers: picked.has("containers"),
    volumes: picked.has("volumes"),
    images: picked.has("images"),
    builds: picked.has("builds"),
    deps: picked.has("deps"),
  };
}

/** Wipe entire stack (used by --all / bootstrap --fresh) */
async function cleanFull(argv, { quiet = false } = {}) {
  const doDocker = argv.includes("--docker") || argv.includes("--all");
  const doProfile = argv.includes("--profile") || argv.includes("--all");
  const doDeps = argv.includes("--deps") || argv.includes("--all");
  // env files are never removed by clean
  const doBuilds =
    argv.includes("--builds") ||
    argv.includes("--all") ||
    argv.includes("--docker");

  if (!quiet) console.log(`\n${c.yellow}▸ Cleaning everything…${c.reset}`);

  if (doDocker) {
    try {
      await requireDocker();
      ensureDockerEnvForCompose();
      await runDocker(["down", "-v", "--rmi", "local", "--remove-orphans"]);
      if (!quiet) console.log(`${c.green}✓ docker stack removed${c.reset}`);
    } catch (err) {
      console.error(
        `${c.yellow}docker clean skipped:${c.reset} ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  if (doProfile && existsSync(profileFile)) {
    clearProfileFile({ quiet });
  }

  if (doBuilds) {
    const buildTargets = [
      "server/dist",
      "client/build",
      "client/.react-router",
      "website/dist",
      "website/.astro",
      "mcp/dist",
      "contracts/dist",
      ".turbo",
      ".cache",
    ];
    for (const rel of buildTargets) {
      const ok = await removePathForce(rel);
      if (ok && !quiet) console.log(`${c.green}✓ removed ${rel}${c.reset}`);
    }
  }

  if (doDeps) {
    const targets = [
      "node_modules",
      "server/node_modules",
      "client/node_modules",
      "website/node_modules",
      "mcp/node_modules",
      "contracts/node_modules",
    ];
    for (const rel of targets) {
      const ok = await removePathForce(rel);
      if (ok && !quiet) console.log(`${c.green}✓ removed ${rel}${c.reset}`);
    }
  }

  if (!quiet) {
    console.log(`
${c.green}${c.bold}✓ Clean complete${c.reset}  ${c.dim}(env files kept)${c.reset}
  ${c.cyan}pnpm bootstrap${c.reset}            set up again
  ${c.cyan}pnpm bootstrap --fresh${c.reset}   clean + bootstrap
`);
  }
}

async function cleanSelected(
  toClean,
  remaining,
  { doContainers, doVolumes, doImages, doBuilds, doDeps, updateProfile, quiet },
) {
  if (!toClean.length) {
    if (!quiet) console.log(`${c.dim}Nothing selected to clean${c.reset}`);
    return;
  }

  if (!quiet) {
    console.log(`\n${c.yellow}▸ Cleaning:${c.reset} ${toClean.join(", ")}`);
    if (remaining.length) {
      console.log(`${c.dim}  keeping (shared deps stay): ${remaining.join(", ")}${c.reset}`);
    }
  }

  const project = getComposeProjectName();

  if (doContainers || doVolumes || doImages) {
    try {
      await requireDocker();
      ensureDockerEnvForCompose();

      if (doContainers) {
        const composeSvcs = [];
        for (const s of toClean) {
          const meta = CLEAN_META[s];
          if (!meta) continue;
          composeSvcs.push(...meta.compose);
          if (s === "server") composeSvcs.push(...(meta.infra ?? []));
        }
        // Gateway is shared edge — drop it when no Docker apps remain (or cleaned explicitly)
        if (
          CLEAN_META.gateway &&
          (toClean.includes("gateway") || !remainingNeedsDocker(remaining))
        ) {
          composeSvcs.push(...CLEAN_META.gateway.compose);
        }
        const uniqueCompose = [...new Set(composeSvcs)];
        if (uniqueCompose.length) {
          try {
            await runDocker(["stop", ...uniqueCompose]);
          } catch {
            /* may not be running */
          }
          try {
            await runDocker(["rm", "-f", ...uniqueCompose]);
          } catch {
            /* ignore */
          }
          if (!quiet) {
            console.log(
              `${c.green}✓ containers removed${c.reset}  ${uniqueCompose.join(", ")}`,
            );
          }
        }
      }

      if (doVolumes) {
        for (const s of toClean) {
          for (const vol of CLEAN_META[s]?.volumes ?? []) {
            await dockerVolumeRm(`${project}_${vol}`, { quiet });
          }
        }
      }

      // Project images first — keep node/nginx until after root-owned build dirs are wiped
      if (doImages) {
        for (const s of toClean) {
          const suffix = CLEAN_META[s]?.imageSuffix;
          if (!suffix) continue;
          await dockerRmi(`${project}-${suffix}`, { quiet });
        }
      }
    } catch (err) {
      console.error(
        `${c.yellow}docker clean skipped:${c.reset} ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  // Builds / deps before dropping base images (docker rm as root needs a local image)
  if (doBuilds) {
    for (const s of toClean) {
      for (const rel of CLEAN_META[s]?.builds ?? []) {
        const ok = await removePathForce(rel);
        if (ok && !quiet) console.log(`${c.green}✓ removed ${rel}${c.reset}`);
      }
    }
    if (!remainingNeedsContracts(remaining)) {
      for (const rel of ["contracts/dist"]) {
        const ok = await removePathForce(rel);
        if (ok && !quiet) {
          console.log(`${c.green}✓ removed ${rel}${c.reset} ${c.dim}(no server/client left)${c.reset}`);
        }
      }
    } else if (!quiet && toClean.some((s) => CLEAN_META[s]?.needsContracts)) {
      console.log(
        `${c.dim}keep contracts/dist — still needed by ${remaining.filter((s) => CLEAN_META[s]?.needsContracts).join(", ")}${c.reset}`,
      );
    }
  }

  if (doDeps) {
    for (const s of toClean) {
      for (const rel of CLEAN_META[s]?.nodeModules ?? []) {
        const ok = await removePathForce(rel);
        if (ok && !quiet) console.log(`${c.green}✓ removed ${rel}${c.reset}`);
      }
    }
    if (!remainingNeedsContracts(remaining)) {
      const ok = await removePathForce("contracts/node_modules");
      if (ok && !quiet) console.log(`${c.green}✓ removed contracts/node_modules${c.reset}`);
    } else if (!quiet) {
      console.log(`${c.dim}keep contracts/node_modules — still needed${c.reset}`);
    }
    if (!remaining.length) {
      const ok = await removePathForce("node_modules");
      if (ok && !quiet) console.log(`${c.green}✓ removed node_modules${c.reset}`);
    } else if (!quiet) {
      console.log(
        `${c.dim}keep root node_modules — still needed by ${remaining.join(", ")}${c.reset}`,
      );
    }
  }

  if (doImages) {
    try {
      await requireDocker();
      if (!remainingNeedsDocker(remaining)) {
        for (const img of ["node:22-alpine", "nginx:alpine"]) {
          await dockerRmi(img, { quiet });
        }
      } else if (!quiet) {
        console.log(
          `${c.dim}keep base images (node/nginx) — still needed by ${remaining.filter((s) => DOCKER_APPS.includes(s)).join(", ")}${c.reset}`,
        );
      }
    } catch {
      /* ignore */
    }
  }

  if (updateProfile) {
    if (!remaining.length) {
      clearProfileFile({ quiet });
    } else {
      writeProfile(remaining);
    }
  }

  if (!quiet) {
    console.log(`
${c.green}${c.bold}✓ Clean complete${c.reset}  ${c.dim}(env files kept)${c.reset}
  ${remaining.length ? `Profile now: ${remaining.join(", ")}` : "Profile empty — run bootstrap"}
  ${c.cyan}pnpm bootstrap${c.reset}   add packages again
`);
  }
}

async function setupCmd(argv) {
  await requireDocker();

  if (argv.includes("--fresh")) {
    console.log(`${c.yellow}▸ Fresh bootstrap — cleaning first…${c.reset}\n`);
    await cleanCmd(["--docker", "--profile", "--builds"], { quiet: true });
    console.log();
  }

  console.log(
    `${c.green}▸ Bootstrap${c.reset} — install + build only what you need (nothing starts)\n`,
  );

  const { services, onlyInstallBuild } = await resolveSetupServices(argv);
  const previousProfile = readProfile();

  console.log(`\n${c.dim}Profile will be:${c.reset} ${services.join(", ")}`);
  if (onlyInstallBuild.length && onlyInstallBuild.length < services.length) {
    console.log(
      `${c.dim}New packages this run:${c.reset} ${onlyInstallBuild.join(", ")}`,
    );
  }
  if (services.includes("server")) {
    console.log(
      `${c.dim}Note: postgres/redis/mailpit pull only when you start the server${c.reset}`,
    );
  } else {
    console.log(
      `${c.dim}Note: no postgres/redis — not needed for this profile${c.reset}`,
    );
  }

  ensureEnvForServices(services);

  const toBuild = onlyInstallBuild.length ? onlyInstallBuild : services;
  const dockerBuild = toBuild.filter((s) => DOCKER_APPS.includes(s));

  try {
    await installForServices(toBuild);

    if (dockerBuild.length) {
      console.log(`\n${c.green}▸ Building Docker images…${c.reset}`);
      await runDocker(["build", ...dockerBuild]);
      // Named node_modules volumes are not replaced by image rebuild — refresh them.
      for (const s of dockerBuild) {
        await syncDockerNodeModules(s);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (previousProfile?.length) {
      console.error(
        `\n${c.yellow}Bootstrap failed — .profile unchanged (${previousProfile.join(", ")})${c.reset}`,
      );
    } else {
      console.error(
        `\n${c.yellow}Bootstrap failed — .profile not saved (services not ready)${c.reset}`,
      );
    }
    if (/registry-1\.docker\.io|no such host|lookup registry|dial tcp/i.test(msg)) {
      console.error(
        `${c.dim}Docker Hub unreachable (DNS/network). Fix connectivity / Docker Desktop DNS, then re-run ${c.cyan}pnpm bootstrap${c.dim}.${c.reset}`,
      );
    } else {
      console.error(
        `${c.dim}Fix the error above, then re-run ${c.cyan}pnpm bootstrap${c.dim}.${c.reset}`,
      );
    }
    throw err;
  }

  // Only commit profile after install + images succeed
  writeProfile(services);

  console.log(`
${c.green}${c.bold}✓ Bootstrap complete${c.reset}  (nothing is running yet)
  Profile: ${services.join(", ")}

  ${c.cyan}pnpm start${c.reset}                 start from profile
  ${c.cyan}pnpm bootstrap${c.reset}             add more / replace profile
  ${c.cyan}pnpm clean${c.reset}                 remove services (+ optional wipe)
`);
}

const PKG_TARGETS = [
  { key: "server", filter: "@template/server", label: "server" },
  { key: "client", filter: "@template/client", label: "client" },
  { key: "mcp", filter: "@template/mcp", label: "mcp" },
  { key: "website", filter: "@template/website", label: "website" },
  { key: "contracts", filter: "@template/contracts", label: "contracts" },
];

/** Add an npm package into a workspace package (from repo root) */
async function addNpmPackageCmd(argv) {
  let targetKey = PKG_TARGETS.find((t) => argv.includes(t.key))?.key ?? null;
  if (!targetKey) {
    const presets = PKG_TARGETS.map((t, i) => ({
      key: String(i + 1),
      label: t.label,
      target: t.key,
    }));
    const picked = await pickPreset("Add npm package to which app?", presets);
    targetKey = picked.target;
  }
  const target = PKG_TARGETS.find((t) => t.key === targetKey);
  if (!target) throw new Error(`Unknown target: ${targetKey}`);

  let pkgName = argv.find(
    (a) =>
      !a.startsWith("-") &&
      !PKG_TARGETS.some((t) => t.key === a) &&
      a !== "pkg" &&
      a !== "add-pkg",
  );
  if (!pkgName) {
    pkgName = await ask(`${c.cyan}Package name (e.g. lodash or zod@3):${c.reset} `);
  }
  if (!pkgName) throw new Error("Package name required");

  const dev =
    argv.includes("--dev") ||
    argv.includes("-D") ||
    (
      await ask(`${c.cyan}devDependency? [y/N]:${c.reset} `)
    ).toLowerCase() === "y";

  const args = ["--filter", target.filter, "add"];
  if (dev) args.push("-D");
  args.push(pkgName);

  console.log(
    `\n${c.green}▸ pnpm ${args.join(" ")}${c.reset}\n`,
  );
  await run("pnpm", args, "pnpm");

  // contracts has no Docker app; sync Docker volumes for runnable apps
  let synced = false;
  if (DOCKER_APPS.includes(target.key)) {
    synced = await syncDockerNodeModules(target.key);
  } else if (target.key === "contracts") {
    // contracts is mounted into server + client volumes
    const profile = readProfile() ?? [];
    for (const s of ["server", "client"].filter((x) => profile.includes(x))) {
      synced = (await syncDockerNodeModules(s)) || synced;
    }
  }

  console.log(`
${c.green}✓ added ${pkgName}${c.reset} → ${target.filter}
${synced ? `${c.green}✓ Docker volumes updated${c.reset}` : ""}

${c.dim}From root you can also run:${c.reset}
  ${c.cyan}pnpm --filter ${target.filter} add ${pkgName}${c.reset}
`);
}

async function startDev(argv) {
  let services = servicesFromFlags(argv);
  if (!services.length) {
    const fromArgv = appsFromArgv(argv);
    if (fromArgv.length) services = fromArgv;
  }

  const explicit = services.length > 0;

  if (!explicit) {
    const profile = readProfile();
    if (!profile?.length) {
      console.log(`${c.yellow}No profile yet — choose what to start${c.reset}`);
      services = await pickApps("What do you want to start?");
      writeProfile(services);
    } else {
      // Hide Docker apps that are already running
      let running = new Set();
      try {
        await requireDocker();
        running = new Set(runningComposeServices());
      } catch {
        /* Docker down — show full profile */
      }

      const already = profile.filter((s) => DOCKER_APPS.includes(s) && running.has(s));
      const available = profile.filter(
        (s) => !DOCKER_APPS.includes(s) || !running.has(s),
      );

      if (already.length) {
        console.log(`${c.dim}Already running:${c.reset} ${already.join(", ")}`);
      }

      if (!available.length) {
        console.log(
          `${c.green}All profile services are already running${c.reset}  (${profile.join(", ")})`,
        );
        console.log(
          `${c.dim}Logs: ${c.cyan}pnpm logs${c.dim}  ·  Stop: ${c.cyan}pnpm stop${c.reset}`,
        );
        return;
      }

      console.log(`${c.dim}Profile:${c.reset} ${profile.join(", ")}`);
      services = await pickApps("Which services to start?", {
        options: available,
      });
    }
  }

  await startServices(services, { build: hasFlag(argv, "--build") });
}

/**
 * Start apps with `up -d`, print URLs, exit.
 * Containers keep running when the terminal closes.
 * Local website always runs in Docker (Astro). Gateway is started with apps.
 */
async function startServices(services, { build = false } = {}) {
  const list = [...new Set(services)].filter((s) => APPS.includes(s));
  if (!list.length) throw new Error("Pick at least one: server, client, mcp, website");

  const dockerStart = list.filter((s) => DOCKER_APPS.includes(s));

  if (dockerStart.length) {
    await requireDocker();
    const allowed = new Set(dockerCfg.services);
    const apps = dockerStart.filter((s) => allowed.has(s));
    if (!apps.length) {
      throw new Error(
        `None of [${dockerStart.join(", ")}] are enabled in docker/environments.json (local)`,
      );
    }
    const infra = ["postgres", "redis", "mailpit", "mqtt", "mediamtx"].filter((s) =>
      allowed.has(s),
    );
    let upServices =
      apps.includes("server") ? [...new Set([...infra, ...apps])] : [...apps];
    if (allowed.has("gateway") && !upServices.includes("gateway")) {
      upServices.push("gateway");
    }
    const args = ["up", "-d"];
    if (build) args.push("--build");
    args.push(...upServices);
    console.log(
      `${c.green}▸ ${build ? "Building & starting" : "Starting"}:${c.reset} ${apps.join(", ")}`,
    );
    if (apps.includes("server")) {
      console.log(`${c.dim}  (+ ${infra.join("/")} via server)${c.reset}`);
    }
    if (upServices.includes("gateway")) {
      console.log(`${c.dim}  (+ gateway → http://localhost:8088)${c.reset}`);
    }
    await runDocker(args);
  }

  console.log(`\n${c.green}${c.bold}✓ Running${c.reset} ${c.dim}(detached)${c.reset}`);
  for (const s of list) {
    console.log(serviceUrls[s]);
  }
  if (dockerCfg.services.includes("gateway")) {
    console.log(serviceUrls.gateway);
  }
  console.log(`
${c.dim}Containers keep running if you close this terminal.${c.reset}
  ${c.cyan}pnpm logs${c.reset}   follow logs
  ${c.cyan}pnpm stop${c.reset}   stop services
`);
}

function loadHostsConfig() {
  const DEFAULT_FIELDS = ["user", "host", "ip", "path", "branch", "gitUrl", "sshKey"];
  // "env" is per-host only — never inherited from top-level
  const pickDefaults = (obj = {}) => {
    const out = {};
    for (const key of DEFAULT_FIELDS) {
      if (obj[key] != null && obj[key] !== "") out[key] = obj[key];
    }
    return out;
  };

  const shared = existsSync(hostsJson)
    ? JSON.parse(readFileSync(hostsJson, "utf8"))
    : { hosts: {} };

  const defaults = pickDefaults(shared);
  const sharedHosts = shared.hosts && typeof shared.hosts === "object" ? shared.hosts : {};
  const hosts = {};
  for (const name of Object.keys(sharedHosts)) {
    hosts[name] = {
      ...defaults,
      ...(sharedHosts[name] || {}),
    };
  }
  return {
    defaultHost: shared.defaultHost ?? null,
    sshKey: shared.sshKey ?? null,
    hosts,
  };
}

function listHostProfiles() {
  return Object.keys(loadHostsConfig().hosts).sort((a, b) => a.localeCompare(b));
}

/** Git branch the VPS will reset to — from deploy/hosts.json, not the laptop checkout. */
function hostGitBranchInfo(hostName) {
  const raw = existsSync(hostsJson)
    ? JSON.parse(readFileSync(hostsJson, "utf8"))
    : {};
  const perHost = raw.hosts?.[hostName]?.branch;
  if (perHost != null && String(perHost).trim() !== "") {
    return {
      branch: String(perHost),
      source: `deploy/hosts.json → hosts.${hostName}.branch`,
    };
  }
  if (raw.branch != null && String(raw.branch).trim() !== "") {
    return {
      branch: String(raw.branch),
      source: `deploy/hosts.json → default "branch" (inherited by host "${hostName}")`,
    };
  }
  return {
    branch: "main",
    source: `deploy/hosts.json has no "branch" — fallback main`,
  };
}

function printPickedHost(hostName) {
  const cfg = loadHostsConfig();
  const h = cfg.hosts[hostName] || {};
  const { branch, source } = hostGitBranchInfo(hostName);
  console.log(`${c.dim}Host:${c.reset} ${hostName}`);
  console.log(
    `  ${c.dim}git:${c.reset} ${c.cyan}${branch}${c.reset}  ${c.dim}(${source})${c.reset}`,
  );
  if (h.path) console.log(`  ${c.dim}path:${c.reset} ${h.path}`);
}

async function confirmGithubBranch(hostName, actionLabel) {
  const { branch, source } = hostGitBranchInfo(hostName);
  console.log(`
${c.yellow}${c.bold}Before ${actionLabel}${c.reset}
  VPS will ${c.bold}git reset --hard origin/${branch}${c.reset}
  ${c.dim}${source}${c.reset}
  Code comes from GitHub only (not unpushed laptop files).
  Env files still sync from this laptop → host.
`);
  const ok = (
    await ask(
      `${c.cyan}Branch ${branch} is pushed on GitHub? [y/N]:${c.reset} `,
    )
  ).toLowerCase();
  if (ok === "y" || ok === "yes") return true;
  console.log(
    `${c.dim}${actionLabel} cancelled — push ${branch}, then run this again.${c.reset}`,
  );
  return false;
}

async function pickHostProfile(argv) {
  const hostIdx = argv.indexOf("--host");
  const fromFlag = hostIdx !== -1 && argv[hostIdx + 1] ? argv[hostIdx + 1] : null;

  const cfg = loadHostsConfig();
  const profiles = Object.keys(cfg.hosts).sort((a, b) => a.localeCompare(b));
  if (profiles.length === 0) {
    throw new Error(
      "No hosts in deploy/hosts.json — add entries under hosts",
    );
  }

  let hostName = fromFlag;
  if (!hostName) {
    if (cfg.defaultHost && profiles.includes(cfg.defaultHost) && !process.stdin.isTTY) {
      hostName = cfg.defaultHost;
    } else if (profiles.length === 1) {
      hostName = profiles[0];
    } else {
      console.log(
        `\n${c.bold}Which host?${c.reset} ${c.dim}(from deploy/hosts.json)${c.reset}\n`,
      );
      profiles.forEach((name, i) => {
        const h = cfg.hosts[name];
        const ip = h.host || h.ip || "?";
        const { branch } = hostGitBranchInfo(name);
        const mark = cfg.defaultHost === name ? " *" : "";
        console.log(
          `  ${c.cyan}${i + 1}${c.reset}) ${name}${mark}  ${c.dim}${ip}  git:${branch}${c.reset}`,
        );
      });
      console.log();
      const choice = await ask(`${c.cyan}Choose [1-${profiles.length}]:${c.reset} `);
      const idx = Number(choice) - 1;
      if (!profiles[idx]) throw new Error(`Invalid host choice: ${choice}`);
      hostName = profiles[idx];
    }
  }

  printPickedHost(hostName);
  return hostName;
}

async function pickDeployTargets(available = DEPLOY_TARGETS) {
  const choices = available.filter(Boolean);
  if (!choices.length) throw new Error("No apps defined for this environment");

  console.log(`\n${c.bold}What do you want to deploy?${c.reset}\n`);
  choices.forEach((name, i) => {
    console.log(`  ${c.cyan}${i + 1}${c.reset}) ${name}`);
  });
  console.log(`  ${c.cyan}all${c.reset}) everything listed`);
  console.log(
    `\n${c.dim}Multi-pick: 1,2  ·  server,client  ·  all${c.reset}\n`,
  );

  const raw = await ask(`${c.cyan}Choose:${c.reset} `);
  const tokens = raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (!tokens.length) throw new Error("Pick at least one (or all)");

  if (tokens.some((t) => t === "all" || t === "*")) {
    return [...choices];
  }

  const picked = [];
  for (const t of tokens) {
    if (choices.includes(t)) {
      picked.push(t);
      continue;
    }
    const n = Number(t);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
      picked.push(choices[n - 1]);
      continue;
    }
    throw new Error(`Unknown / not available here: ${t}`);
  }

  return [...new Set(picked)];
}

function deployTargetsFromArgv(argv, available = DEPLOY_TARGETS) {
  if (argv.includes("--all") || argv.includes("all")) {
    return [...available];
  }
  const named = [];
  for (const t of available) {
    if (argv.includes(`--${t}`) || argv.includes(t)) named.push(t);
  }
  return named;
}

async function deployInteractive(argv) {
  const rawHosts = JSON.parse(
    existsSync(hostsJson) ? readFileSync(hostsJson, "utf8") : "{}",
  );

  const hostFromFlag =
    argv.includes("--host") && argv[argv.indexOf("--host") + 1]
      ? argv[argv.indexOf("--host") + 1]
      : null;

  // Host first → know which apps exist under environments.<host>
  let hostName = hostFromFlag;
  if (!hostName) {
    hostName = await pickHostProfile(argv);
  }

  const envName =
    (hostName && rawHosts.hosts?.[hostName]?.env) || hostName || "local";
  const available = listEnvApps(envName);
  if (!available.length) {
    throw new Error(
      `No client/server/mcp/website under environments.${envName} in docker/environments.json`,
    );
  }

  // GitHub branch check first — host already known; apps picked after.
  if (hostName && !argv.includes("--github-ok")) {
    const okPush = await confirmGithubBranch(hostName, "deploy");
    if (!okPush) return;
  }

  let targets = deployTargetsFromArgv(argv, available);
  if (!targets.length) targets = await pickDeployTargets(available);

  // clientMode / websiteMode from environments.json
  let hostMode = "nginx";
  let websiteMode = "docker";
  try {
    const cfg = loadDockerEnvironment(envName);
    hostMode = cfg.clientMode || "nginx";
    websiteMode = cfg.websiteMode || "docker";
  } catch {
    /* keep defaults */
  }
  if (hostName && rawHosts.hosts?.[hostName]?.clientMode) {
    hostMode = String(rawHosts.hosts[hostName].clientMode).toLowerCase();
  }
  if (argv.includes("--client-mode") && argv[argv.indexOf("--client-mode") + 1]) {
    hostMode = String(argv[argv.indexOf("--client-mode") + 1]).toLowerCase();
  }

  const isCdnTarget = (t) =>
    (t === "client" && hostMode === "cdn") ||
    (t === "website" && websiteMode === "cdn");

  const dockerTargets = targets.filter((t) => !isCdnTarget(t));
  const cdnTargets = targets.filter((t) => isCdnTarget(t));
  const needsHost = dockerTargets.length > 0;

  if (needsHost && !hostName) {
    throw new Error("Host required for this deploy");
  }

  // Clear CDN notice before anything else
  if (cdnTargets.length) {
    console.log(`
${c.yellow}${c.bold}CDN (no Docker / no VPS prompts)${c.reset}
  ${cdnTargets.join(", ")} — build on this laptop + upload instructions.
  Skipping: GitHub branch check, volumes, start containers.
`);
  }

  // VPS Docker prompts — env / prune / volumes / start (git branch already confirmed)
  let syncEnv = argv.includes("--sync-env");
  let pruneImages = argv.includes("--prune-images");
  let removeVolumes = argv.includes("--volumes");
  let startContainers = false;
  let runMigrations = false;
  if (needsHost && hostName && dockerTargets.length) {
    console.log(`
${c.yellow}${c.bold}Before Docker build on ${hostName}${c.reset}
  Apps: ${dockerTargets.join(", ")}
`);

    if (!argv.includes("--sync-env") && !argv.includes("--no-sync-env")) {
      const envAns = (
        await ask(
          `${c.cyan}Sync env files first?${c.reset} ${c.dim}(default No — keep remote env)${c.reset} [y/N]: `,
        )
      ).toLowerCase();
      syncEnv = envAns === "y" || envAns === "yes";
    } else if (argv.includes("--no-sync-env")) {
      syncEnv = false;
    }
    console.log(
      syncEnv
        ? `${c.dim}will upload env files from laptop${c.reset}`
        : `${c.dim}remote env files kept${c.reset}`,
    );

    if (!argv.includes("--prune-images")) {
      const pruneAns = (
        await ask(
          `${c.cyan}Prune old images first?${c.reset} ${c.dim}(default No — keep Docker cache)${c.reset} [y/N]: `,
        )
      ).toLowerCase();
      pruneImages = pruneAns === "y" || pruneAns === "yes";
    }
    console.log(
      pruneImages
        ? `${c.dim}will remove old containers + images for: ${dockerTargets.join(", ")}${c.reset}`
        : `${c.dim}Docker images kept${c.reset}`,
    );

    if (!argv.includes("--volumes")) {
      const vol = (
        await ask(
          `${c.yellow}Remove volumes too?${c.reset} ${c.dim}(DB data / uploads — default No)${c.reset} [y/N]: `,
        )
      ).toLowerCase();
      removeVolumes = vol === "y" || vol === "yes";
    }
    if (removeVolumes) {
      console.log(`${c.yellow}⚠ volumes will be deleted${c.reset}`);
    } else {
      console.log(`${c.dim}volumes kept${c.reset}`);
    }
    const startAns = (
      await ask(
        `${c.cyan}Start containers after deploy?${c.reset} ${c.dim}(default No — build images only)${c.reset} [y/N]: `,
      )
    ).toLowerCase();
    startContainers = startAns === "y" || startAns === "yes";
    console.log(
      startContainers
        ? `${c.dim}will start containers after build${c.reset}`
        : `${c.dim}build only — start later via Remote → Start${c.reset}`,
    );

    const deployingServer = dockerTargets.includes("server");
    if (startContainers && deployingServer) {
      const migAns = (
        await ask(
          `${c.cyan}Run database migrations?${c.reset} ${c.dim}(server only — default No)${c.reset} [y/N]: `,
        )
      ).toLowerCase();
      runMigrations = migAns === "y" || migAns === "yes";
      console.log(
        runMigrations
          ? `${c.dim}will run TypeORM migrations after server start${c.reset}`
          : `${c.dim}skip migrations — run later with pnpm migrate${c.reset}`,
      );
    }
  }

  console.log(
    `\n${c.green}▸ Deploy${c.reset}  ${targets.join(", ")}${needsHost ? `  → ${hostName}` : "  (CDN / laptop)"}${cdnTargets.length || dockerTargets.length ? `  (client=${hostMode}, website=${websiteMode})` : ""}\n`,
  );

  const verbose = argv.includes("--verbose") || argv.includes("-v");
  let prepared = false;

  for (const t of targets) {
    if (isCdnTarget(t)) {
      if (t === "website") {
        await runInherit(
          "node",
          [
            "./scripts/deploy.mjs",
            "--target",
            "website",
            "--env",
            envName,
            ...(verbose ? ["--verbose"] : []),
          ],
          "deploy",
        );
      } else {
        await runInherit(
          "node",
          [
            "./scripts/deploy.mjs",
            "--target",
            "client",
            "--client-mode",
            "cdn",
            ...(verbose ? ["--verbose"] : []),
          ],
          "deploy",
        );
      }
      continue;
    }
    if (!hostName) throw new Error("Host required for remote deploy");
    await runInherit(
      "node",
      [
        "./scripts/deploy.mjs",
        "--host",
        hostName,
        "--target",
        t,
        "--client-mode",
        hostMode,
        ...(syncEnv ? ["--sync-env"] : ["--no-sync-env"]),
        ...(pruneImages ? ["--prune-images"] : []),
        ...(removeVolumes ? ["--volumes"] : []),
        ...(startContainers ? ["--start"] : []),
        ...(runMigrations && t === "server" ? ["--migrate"] : []),
        ...(prepared ? ["--skip-prepare"] : []),
        ...(verbose ? ["--verbose"] : []),
      ],
      "deploy",
    );
    prepared = true;
  }
}

const REMOTE_ACTIONS = [
  "status",
  "start",
  "reload",
  "stop",
  "logs",
  "clean",
  "env",
  "pull",
  "deploy",
];
const REMOTE_HOST_ONLY = ["env", "pull"];

function remoteActionFromArgv(argv) {
  for (const a of argv) {
    if (a === "restart") return "reload";
    if (a === "ps") return "status";
    if (a === "sync-env") return "env";
    if (REMOTE_ACTIONS.includes(a)) return a;
  }
  return null;
}

/** Pick remote services — same multi-pick UX as local start/logs/stop. */
async function pickRemoteServices(action) {
  if (action === "clean") {
    const list = await pickApps("What do you want to remove?", {
      options: DOCKER_APPS,
    });
    // all apps selected → treat as full stack clean
    const all = list.length === DOCKER_APPS.length;
    return { services: all ? [] : list, all };
  }

  if (action === "stop") {
    console.log(`\n${c.bold}Which services to stop?${c.reset}\n`);
    DOCKER_APPS.forEach((name, i) => {
      console.log(`  ${c.cyan}${i + 1}${c.reset}) ${name}`);
    });
    console.log(
      `  ${c.cyan}all${c.reset}) everything running (incl. postgres/redis)`,
    );
    console.log(
      `\n${c.dim}Stop only — containers kept. Clean removes them.${c.reset}`,
    );
    console.log(`\n${c.dim}Examples: 1  ·  server,client  ·  all${c.reset}\n`);
    const raw = await ask(`${c.cyan}Choose:${c.reset} `);
    const tokens = raw
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) throw new Error("Pick at least one service or all");
    if (tokens.some((t) => t === "all" || t === "*")) {
      return { services: [], all: true };
    }
    const picked = [];
    for (const t of tokens) {
      if (DOCKER_APPS.includes(t)) {
        picked.push(t);
        continue;
      }
      const n = Number(t);
      if (Number.isInteger(n) && n >= 1 && n <= DOCKER_APPS.length) {
        picked.push(DOCKER_APPS[n - 1]);
        continue;
      }
      throw new Error(`Unknown: ${t}`);
    }
    return { services: [...new Set(picked)], all: false };
  }

  const title =
    action === "logs"
      ? "Follow logs for?"
      : action === "start"
        ? "Which services to start?"
        : action === "reload"
          ? "Which services?"
          : `Which services to ${action}?`;

  const list = await pickApps(title, { options: [...DOCKER_APPS, "gateway"] });
  // all listed apps → --all for stack-wide ops
  if (list.length === DOCKER_APPS.length) {
    return { services: [], all: true };
  }
  return { services: list, all: false };
}

/** Full stdio inherit — needed for SSH -t logs / interactive remote. */
function runInherit(command, args, label = "run") {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, FORCE_COLOR: "1" },
      stdio: "inherit",
    });
    child.on("exit", (code, signal) => {
      if (signal) resolvePromise();
      else if (code === 0) resolvePromise();
      else reject(new Error(`${label} exited ${code}`));
    });
  });
}

async function remoteInteractive(argv) {
  const hostName = await pickHostProfile(argv);

  let action = remoteActionFromArgv(argv);
  if (!action) {
    const picked = await pickPreset("Remote action?", REMOTE_ACTION_PRESETS);
    action = picked.cmd;
  }

  // Deploy: GitHub confirm happens inside deployInteractive before picking apps
  if (action === "deploy") {
    await deployInteractive([
      ...argv.filter((a) => a !== "deploy"),
      "--host",
      hostName,
    ]);
    return;
  }

  if (action === "pull") {
    const okPush = await confirmGithubBranch(hostName, "pull");
    if (!okPush) return;
    console.log(
      `${c.dim}Keeps env/. Does not rebuild images or restart containers.${c.reset}`,
    );
  }

  let all = argv.includes("all") || argv.includes("--all");
  let volumes = argv.includes("--volumes") || argv.includes("-v");
  let containers = argv.includes("--containers");
  let images = argv.includes("--images");
  let builds = argv.includes("--builds");
  let deps = argv.includes("--deps");
  let noReload = argv.includes("--no-reload");
  let services = [
    ...new Set(argv.filter((a) => DOCKER_APPS.includes(a) || a === "gateway")),
  ];
  let target =
    argv.includes("--target") && argv[argv.indexOf("--target") + 1]
      ? argv[argv.indexOf("--target") + 1]
      : null;

  const needsServices = !["status", "pull"].includes(action);

  // Reload (env): pick services, then sync env + recreate
  if (action === "env" || action === "reload") {
    if (action === "reload") action = "env";
    if (!all && !services.length) {
      const picked = await pickRemoteServices("reload");
      services = picked.services;
      all = picked.all;
    }
  } else if (needsServices && !all && !services.length) {
    const picked = await pickRemoteServices(action);
    services = picked.services;
    all = picked.all;
  }

  if (action === "clean") {
    const hasLayerFlag =
      containers ||
      volumes ||
      images ||
      builds ||
      deps ||
      argv.includes("--all-layers");
    if (!hasLayerFlag) {
      const layers = await pickCleanLayers();
      containers = layers.containers;
      volumes = layers.volumes;
      images = layers.images;
      builds = layers.builds;
      deps = layers.deps;
    } else if (argv.includes("--all-layers")) {
      containers = volumes = images = builds = deps = true;
    }
    if (!containers && !volumes && !images && !builds && !deps) {
      containers = true;
    }
  }

  if (action === "env") {
    console.log(`${c.dim}Sync env + recreate containers (same images).${c.reset}`);
  }

  const nodeArgs = [
    "./scripts/remote.mjs",
    "--host",
    hostName,
    "--action",
    action,
  ];
  if (all) nodeArgs.push("--all");
  if (volumes) nodeArgs.push("--volumes");
  if (containers) nodeArgs.push("--containers");
  if (images) nodeArgs.push("--images");
  if (builds) nodeArgs.push("--builds");
  if (deps) nodeArgs.push("--deps");
  if (noReload) nodeArgs.push("--no-reload");
  if (target) nodeArgs.push("--target", target);
  nodeArgs.push(...services);

  const layerBits = [];
  if (action === "clean") {
    if (containers) layerBits.push("containers");
    if (volumes) layerBits.push("volumes");
    if (images) layerBits.push("images");
    if (builds) layerBits.push("builds");
    if (deps) layerBits.push("deps");
  }

  console.log(
    `\n${c.green}▸ Remote${c.reset}  host=${hostName}  action=${action}` +
      (REMOTE_HOST_ONLY.includes(action)
        ? all || services.length
          ? all
            ? "  services=all"
            : `  services=${services.join(",")}`
          : ""
        : all
          ? "  services=all"
          : services.length
            ? `  services=${services.join(",")}`
            : "") +
      (layerBits.length ? `  layers=${layerBits.join(",")}` : "") +
      `\n`,
  );

  await runInherit("node", nodeArgs, "remote");
}

function hasFlag(argv, flag) {
  return argv.includes(flag);
}

async function pickApp(title = "Which service?") {
  const list = await pickApps(title, { single: true });
  return list[0];
}

/** Pick one or more apps by number, name, or "all" (optional subset via options) */
async function pickApps(
  title = "Which services?",
  { single = false, options = APPS, marks = {} } = {},
) {
  const known = new Set([...APPS, "gateway"]);
  const choices = options.filter((s) => known.has(s));
  if (!choices.length) throw new Error("No services to choose from");

  console.log(`\n${c.bold}${title}${c.reset}\n`);
  choices.forEach((name, i) => {
    const mark = marks[name] ? `  ${c.dim}${marks[name]}${c.reset}` : "";
    console.log(`  ${c.cyan}${i + 1}${c.reset}) ${name}${mark}`);
  });
  if (!single) {
    console.log(`  ${c.cyan}all${c.reset}) everything listed`);
    console.log(
      `\n${c.dim}Examples: 1  ·  1,3  ·  ${choices.slice(0, 2).join(",")}  ·  all${c.reset}\n`,
    );
  } else {
    console.log();
  }

  const hint = single
    ? `${c.cyan}Choose [1-${choices.length}]:${c.reset} `
    : `${c.cyan}Choose:${c.reset} `;
  const raw = await ask(hint);
  const tokens = raw
    .split(/[,\s]+/)
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (!tokens.length) throw new Error("Pick at least one service");

  if (!single && tokens.some((t) => t === "all" || t === "*")) {
    return [...choices];
  }

  const picked = [];
  for (const t of tokens) {
    if (choices.includes(t)) {
      picked.push(t);
      continue;
    }
    const n = Number(t);
    if (Number.isInteger(n) && n >= 1 && n <= choices.length) {
      picked.push(choices[n - 1]);
      continue;
    }
    throw new Error(`Unknown / not in list: ${t}`);
  }

  const unique = [...new Set(picked)];
  if (single && unique.length !== 1) {
    throw new Error("Pick exactly one service");
  }
  return unique;
}

function appsFromArgv(argv) {
  if (argv.includes("all") || argv.includes("--all")) return [...APPS];
  return [...new Set(argv.filter((a) => APPS.includes(a) || a === "gateway"))];
}

async function resolveAppList(argv, title) {
  const fromArgv = appsFromArgv(argv);
  if (fromArgv.length) return fromArgv;
  return pickApps(title);
}

async function pickMigrateAction() {
  const preset = await pickPreset("Migrate", [
    { key: "1", label: "Run pending", cmd: "run" },
    { key: "2", label: "Generate", cmd: "generate" },
    { key: "3", label: "Revert last", cmd: "revert" },
  ]);
  return preset.cmd;
}

async function pickBuildTarget() {
  const preset = await pickPreset("Build", [
    { key: "1", label: "Everything", target: "all" },
    { key: "2", label: "Server", target: "server" },
    { key: "3", label: "Client", target: "client" },
    { key: "4", label: "Website", target: "website" },
    { key: "5", label: "MCP", target: "mcp" },
  ]);
  return preset.target;
}

async function runMigrate(mode, name = "auto") {
  await requireDocker();
  const typeorm = [
    "exec",
    "-w",
    "/app/server",
    "server",
    "npx",
    "typeorm-ts-node-commonjs",
  ];
  if (mode === "generate") {
    await runDocker([
      ...typeorm,
      "migration:generate",
      "-d",
      "src/database/data-source.ts",
      `src/migrations/${name}`,
    ], "migrate");
    console.log(`${c.green}✓ migration file created${c.reset}`);
    return;
  }
  if (mode === "revert") {
    await runDocker([
      ...typeorm,
      "migration:revert",
      "-d",
      "src/database/data-source.ts",
    ], "migrate");
    console.log(`${c.green}✓ last migration reverted${c.reset}`);
    return;
  }
  console.log(`${c.green}▸ Running migrations…${c.reset}`);
  try {
    await runDocker([
      ...typeorm,
      "migration:run",
      "-d",
      "src/database/data-source.ts",
    ], "migrate");
  } catch {
    await runDocker(
      [
        "exec",
        "server",
        "sh",
        "-c",
        `cd /app/server && for p in dist/database/data-source.js dist/src/database/data-source.js; do
  [ -f "$p" ] || continue
  echo "using /app/server/$p"
  node -e "require('./$p').default.initialize().then(ds=>ds.runMigrations().then(()=>{console.log('✓ migrations');return ds.destroy()})).catch(e=>{console.error(e);process.exit(1)})"
  exit 0
done
exit 1`,
      ],
      "migrate",
    );
  }
  console.log(`${c.green}✓ migrations applied${c.reset}`);
}

async function runBuild(target) {
  if (target === "all" || !target) {
    await run("pnpm", ["--filter", "@template/contracts", "build"], "contracts");
    await run("pnpm", ["--filter", "@template/server", "build"], "server");
    await run("pnpm", ["--filter", "@template/client", "build"], "client");
    await run("pnpm", ["--filter", "@template/website", "build"], "website");
    await run("pnpm", ["--filter", "@template/mcp", "build"], "mcp");
    console.log(`${c.green}✓ build complete${c.reset}`);
    return;
  }
  if (target === "server" || target === "client") {
    await run("pnpm", ["--filter", "@template/contracts", "build"], "contracts");
  }
  await run("pnpm", ["--filter", PNPM_FILTER[target].replace(/\.\.\.$/, ""), "build"], target);
}

async function runRestart(services) {
  const list = (Array.isArray(services) ? services : [services]).filter(
    (s) => APPS.includes(s) || s === "gateway",
  );
  if (!list.length) throw new Error("Pick at least one service to restart");

  await requireDocker();
  const allowed = new Set(dockerCfg.services);

  if (list.length === 1 && list[0] === "gateway") {
    if (!allowed.has("gateway")) {
      throw new Error("Gateway is not enabled in docker/environments.json");
    }
    console.log(`${c.green}▸ Reloading:${c.reset} gateway`);
    await runDocker(["up", "-d", "--no-deps", "--force-recreate", "gateway"]);
    console.log(`${c.green}✓ reloaded${c.reset}  gateway`);
    return;
  }

  const docker = list.filter((s) => DOCKER_APPS.includes(s));
  if (!docker.length) return;

  // up -d works for stopped or running; restart alone fails if the container was stopped
  const apps = docker.filter((s) => allowed.has(s));
  const infra = ["postgres", "redis", "mailpit"].filter((s) => allowed.has(s));
  const targets =
    apps.includes("server") ? [...new Set([...infra, ...apps])] : apps;
  console.log(`${c.green}▸ Reloading:${c.reset} ${apps.join(", ")}`);
  await runDocker(["up", "-d", "--force-recreate", ...targets]);
  console.log(`${c.green}✓ reloaded${c.reset}  ${apps.join(", ")}`);
}

/** Stop selected apps (containers kept). `all` stops every compose service — does not remove. */
async function stopCmd(argv) {
  await requireDocker();

  const allCompose = dockerCfg.services.filter(Boolean);
  const stopAll = async () => {
    const running = runningComposeServices();
    const targets = running.length ? running : allCompose;
    if (!targets.length) {
      console.log(`${c.dim}Nothing to stop${c.reset}`);
      return;
    }
    console.log(`${c.yellow}▸ Stopping:${c.reset} ${targets.join(", ")}`);
    await runDocker(["stop", ...targets]);
    console.log(
      `${c.green}✓ stopped${c.reset} (containers kept — ${c.cyan}pnpm start${c.reset} to run again; ${c.cyan}pnpm clean${c.reset} to remove)`,
    );
  };

  if (argv.includes("all") || argv.includes("--all")) {
    await stopAll();
    return;
  }

  const fromArgv = [...new Set(argv.filter((a) => DOCKER_APPS.includes(a)))];
  let services = fromArgv;
  let fullStack = false;

  if (!services.length) {
    console.log(`\n${c.bold}Which services to stop?${c.reset}\n`);
    DOCKER_APPS.forEach((name, i) => {
      console.log(`  ${c.cyan}${i + 1}${c.reset}) ${name}`);
    });
    console.log(`  ${c.cyan}all${c.reset}) everything running (incl. postgres/redis/mailpit)`);
    console.log(
      `\n${c.dim}Examples: 1  ·  1,3  ·  server,client  ·  all${c.reset}\n`,
    );
    const raw = await ask(`${c.cyan}Choose:${c.reset} `);
    const tokens = raw
      .split(/[,\s]+/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    if (!tokens.length) throw new Error("Pick at least one service");
    if (tokens.some((t) => t === "all" || t === "*")) {
      fullStack = true;
    } else {
      const picked = [];
      for (const t of tokens) {
        if (DOCKER_APPS.includes(t)) {
          picked.push(t);
          continue;
        }
        const n = Number(t);
        if (Number.isInteger(n) && n >= 1 && n <= DOCKER_APPS.length) {
          picked.push(DOCKER_APPS[n - 1]);
          continue;
        }
        throw new Error(`Unknown / not in list: ${t}`);
      }
      services = [...new Set(picked)];
    }
  }

  if (fullStack) {
    await stopAll();
    return;
  }

  const running = new Set(runningComposeServices());
  const live = services.filter((s) => running.has(s));
  const dead = services.filter((s) => !running.has(s));
  if (dead.length) {
    console.log(`${c.dim}Already stopped:${c.reset} ${dead.join(", ")}`);
  }
  if (!live.length) {
    console.log(`${c.dim}Nothing running to stop${c.reset}`);
    return;
  }

  const toStop = [...live];
  // If no Docker apps will remain running, stop the shared gateway too
  const appsStillUp = DOCKER_APPS.filter(
    (s) => running.has(s) && !live.includes(s),
  );
  if (!appsStillUp.length && running.has("gateway") && !toStop.includes("gateway")) {
    toStop.push("gateway");
  }

  console.log(`${c.yellow}▸ Stopping:${c.reset} ${toStop.join(", ")}`);
  await runDocker(["stop", ...toStop]);
  console.log(`${c.green}✓ stopped${c.reset}  ${toStop.join(", ")}`);
  console.log(
    `${c.dim}Containers kept — ${c.cyan}pnpm start${c.dim} to run again; ${c.cyan}pnpm stop all${c.dim} for infra too; ${c.cyan}pnpm clean${c.dim} to remove${c.reset}`,
  );
}

/** Follow logs for one or more Docker apps; Ctrl+C detaches only. */
async function logsCmd(argv) {
  await requireDocker();
  let services = [...new Set(argv.filter((a) => DOCKER_APPS.includes(a)))];
  if (!services.length) {
    if (argv.includes("all") || argv.includes("--all")) {
      services = [...DOCKER_APPS];
    } else {
      services = await pickApps("Follow logs for?", { options: DOCKER_APPS });
    }
  }

  const running = new Set(runningComposeServices());
  const live = services.filter((s) => running.has(s));
  const dead = services.filter((s) => !running.has(s));

  if (dead.length) {
    console.error(
      `${c.red}Not running:${c.reset} ${dead.join(", ")}\n` +
        `${c.dim}Start first:${c.reset} ${c.cyan}pnpm start ${dead.join(" ")}${c.reset}`,
    );
  }
  if (!live.length) {
    throw new Error("No selected services are running — nothing to follow");
  }
  if (dead.length) {
    console.log(`${c.yellow}Following only running:${c.reset} ${live.join(", ")}\n`);
  } else {
    console.log(
      `${c.dim}Following ${live.join(", ")} — Ctrl+C to detach${c.reset}\n`,
    );
  }
  await followLogs(live);
}

async function dispatch(cmd, argv) {
  const build = hasFlag(argv, "--build");

  switch (cmd) {
    case "help":
    case "-h":
    case "--help":
      help();
      return;

    case "setup":
    case "bootstrap":
      await setupCmd(argv);
      return;

    case "start":
      await startDev(argv);
      return;

    case "stop":
      await stopCmd(argv);
      return;

    case "clean":
      await cleanCmd(argv);
      return;

    case "add":
    case "remove":
    case "service":
      console.log(
        `${c.yellow}Use ${c.cyan}pnpm bootstrap${c.yellow} to add/replace services, ${c.cyan}pnpm clean${c.yellow} to remove${c.reset}`,
      );
      return;

    case "pkg":
    case "add-pkg":
      await addNpmPackageCmd(argv);
      return;

    case "logs":
      await logsCmd(argv);
      return;

    case "restart": {
      const list = await resolveAppList(argv, "Which services to restart?");
      await runRestart(list);
      return;
    }

    case "build": {
      const target = ["all", ...APPS].includes(argv[0])
        ? argv[0]
        : await pickBuildTarget();
      await runBuild(target);
      return;
    }

    case "migrate": {
      let mode = "run";
      let name = "auto";
      if (argv[0] === "generate" || argv[0] === "revert" || argv[0] === "run") {
        mode = argv[0];
        name = argv[1] ?? "auto";
      } else if (argv.length === 0) {
        mode = await pickMigrateAction();
        if (mode === "generate") {
          name = (await ask(`${c.cyan}Migration name [auto]:${c.reset} `)) || "auto";
        }
      }
      await runMigrate(mode, name);
      return;
    }

    case "deploy":
      await deployInteractive(argv);
      return;

    case "remote":
      await remoteInteractive(argv);
      return;

    default:
      console.error(`${c.red}Unknown:${c.reset} ${cmd}\n`);
      help();
      process.exit(1);
  }
}

async function main() {
  const argv = process.argv.slice(2);

  // Keep Explorer in sync with .profile (hide unused app folders).
  const existingProfile = readProfile();
  if (existingProfile) syncExplorerVisibility(existingProfile, { quiet: true });

  try {
    if (argv.length === 0 || argv[0] === "menu") {
      const action = await pickPreset("What do you want to do?", ACTION_PRESETS);
      await dispatch(action.cmd, []);
      return;
    }

    await dispatch(argv[0], argv.slice(1));
  } catch (err) {
    console.error(
      `\n${c.red}${err instanceof Error ? err.message : err}${c.reset}`,
    );
    process.exit(1);
  }
}

main();
