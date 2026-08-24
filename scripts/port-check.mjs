/**
 * *_INTERNAL = container / Docker network (always in compose.yml expose)
 * *_EXPOSE   = host outside (optional). If omitted → no host publish, no deploy check.
 *
 * When EXPOSE is set, writePublishPortsCompose adds ports: EXPOSE:INTERNAL
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/** host EXPOSE key + matching INTERNAL key (+ default internal) */
const PUBLISH = {
  server: [
    {
      exposeKey: "SERVER_EXPOSE",
      internalKey: "SERVER_INTERNAL",
      internalDefault: "3000",
    },
  ],
  client: [
    {
      exposeKey: "CLIENT_EXPOSE",
      internalKey: "CLIENT_INTERNAL",
      internalDefault: "5173",
    },
  ],
  mcp: [
    {
      exposeKey: "MCP_EXPOSE",
      internalKey: "MCP_INTERNAL",
      internalDefault: "4000",
    },
  ],
  website: [
    {
      exposeKey: "WEBSITE_EXPOSE",
      internalKey: "WEBSITE_INTERNAL",
      internalDefault: "4321",
    },
  ],
  postgres: [
    {
      exposeKey: "POSTGRES_EXPOSE",
      internalKey: "POSTGRES_INTERNAL",
      internalDefault: "5432",
    },
  ],
  mailpit: [
    {
      exposeKey: "MAILPIT_UI_EXPOSE",
      internalKey: "MAILPIT_UI_INTERNAL",
      internalDefault: "8025",
    },
    {
      exposeKey: "MAILPIT_SMTP_EXPOSE",
      internalKey: "MAILPIT_SMTP_INTERNAL",
      internalDefault: "1025",
    },
  ],
  gateway: [
    {
      exposeKey: "GATEWAY_EXPOSE",
      internalKey: "GATEWAY_INTERNAL",
      internalDefault: "80",
    },
  ],
};

export function readEnvFile(filePath) {
  const out = {};
  if (!existsSync(filePath)) return out;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

function definedPort(vars, key) {
  if (!(key in vars)) return null;
  const raw = String(vars[key] ?? "").trim();
  if (!raw) return null;
  const host = raw.includes(":") ? raw.split(":")[0].trim() : raw;
  return /^\d+$/.test(host) ? host : null;
}

/**
 * Only services with *_EXPOSE set.
 * @returns {{ service: string, host: string, internal: string, label: string }[]}
 */
export function collectPublishBindings(cfg, services = null, rootDir = process.cwd()) {
  const vars = readEnvFile(resolve(rootDir, cfg.dockerEnv || "env/docker.env"));
  const want = services ? new Set(services) : null;
  const out = [];

  for (const [service, entries] of Object.entries(PUBLISH)) {
    if (want && !want.has(service)) continue;
    for (const e of entries) {
      const host = definedPort(vars, e.exposeKey);
      if (!host) continue;
      const internal =
        definedPort(vars, e.internalKey) || e.internalDefault;
      out.push({
        service,
        host,
        internal,
        label: service === "mailpit" ? e.exposeKey : service,
      });
    }
  }
  return out;
}

/** Deploy check = same as publish (only defined *_EXPOSE). */
export function collectHostPorts(cfg, services, rootDir = process.cwd()) {
  return collectPublishBindings(cfg, services, rootDir).map((b) => ({
    port: b.host,
    label: b.label,
  }));
}

/** Write ports: only where *_EXPOSE is defined. */
export function writePublishPortsCompose(cfg, rootDir) {
  const root = rootDir || cfg.root || process.cwd();
  const bindings = collectPublishBindings(cfg, null, root);
  const outPath = resolve(root, "docker/.compose-publish.yml");

  if (!bindings.length) {
    writeFileSync(
      outPath,
      "# auto-generated — no *_EXPOSE set → host publish off\nservices: {}\n",
    );
    return outPath;
  }

  /** @type {Record<string, string[]>} */
  const by = {};
  for (const b of bindings) {
    if (!by[b.service]) by[b.service] = [];
    by[b.service].push(`      - "${b.host}:${b.internal}"`);
  }
  let yaml =
    "# auto-generated — ports only where *_EXPOSE is set in env\nservices:\n";
  for (const [svc, ports] of Object.entries(by)) {
    yaml += `  ${svc}:\n    ports:\n${ports.join("\n")}\n`;
  }
  writeFileSync(outPath, yaml);
  return outPath;
}

function dockerHolders(port) {
  const r = spawnSync(
    "docker",
    ["ps", "--format", "{{.Names}}\t{{.Ports}}"],
    { encoding: "utf8" },
  );
  if ((r.status ?? 1) !== 0) return [];
  const a = `:${port}->`;
  const b = `:${port}/`;
  const names = [];
  for (const line of (r.stdout || "").split("\n")) {
    if (!line.trim()) continue;
    const [name, ...rest] = line.split("\t");
    const ports = rest.join("\t");
    if (ports.includes(a) || ports.includes(b)) names.push(name.trim());
  }
  return names;
}

function hostListening(port) {
  const ss = spawnSync("ss", ["-tlnH"], { encoding: "utf8" });
  if ((ss.status ?? 1) === 0 && ss.stdout) {
    const re = new RegExp(`[:.]${port}$`);
    for (const line of ss.stdout.split("\n")) {
      const local = line.trim().split(/\s+/)[3] || "";
      if (re.test(local)) return true;
    }
    return false;
  }
  return (
    (spawnSync("fuser", [`${port}/tcp`], { encoding: "utf8" }).status ?? 1) ===
    0
  );
}

export function portConflict(projectName, port) {
  const prefix = `${projectName}-`;
  const holders = dockerHolders(port);
  if (holders.length) {
    const foreign = holders.filter((n) => !n.startsWith(prefix));
    return foreign.length ? `docker:${foreign.join(",")}` : null;
  }
  if (hostListening(port)) return "host-process";
  return null;
}

export function findPortConflicts(projectName, ports) {
  return ports
    .map(({ port, label }) => {
      const who = portConflict(projectName, port);
      return who ? { port, label, who } : null;
    })
    .filter(Boolean);
}

export function formatPortConflicts(conflicts) {
  return [
    "Host port(s) already in use — aborting before build/start:",
    ...conflicts.map((c) => `  ${c.label}  →  :${c.port}  (${c.who})`),
    "Fix: stop the other app, or change/omit that *_EXPOSE in env/docker.env.",
  ].join("\n");
}

export function assertHostPortsAvailable(projectName, ports) {
  const conflicts = findPortConflicts(projectName, ports);
  if (!conflicts.length) return;
  console.error(`\n${formatPortConflicts(conflicts)}\n`);
  process.exit(1);
}

export function remotePortCheckShell(projectName, ports) {
  const specs = ports.map((p) => `${p.port}|${p.label}`).join(" ");
  return `
PROJECT=${JSON.stringify(projectName)}
SPECS=${JSON.stringify(specs)}
bad=0
for spec in $SPECS; do
  PORT="\${spec%%|*}"
  LABEL="\${spec#*|}"
  holders=$(docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | while read -r name ports; do
    case "\$ports" in
      *":\${PORT}->"*|*":\${PORT}/"*) echo "\$name" ;;
    esac
  done)
  if [ -n "\$holders" ]; then
    for n in \$holders; do
      case "\$n" in
        "\$PROJECT"-*) ;;
        *) echo "CONFLICT \$LABEL :\$PORT docker:\$n"; bad=1 ;;
      esac
    done
  elif ss -tlnH 2>/dev/null | awk '{print \$4}' | grep -qE "[:.]\$PORT\$"; then
    echo "CONFLICT \$LABEL :\$PORT host-process"
    bad=1
  fi
done
[ "\$bad" -eq 0 ] || { echo "Fix: stop other app or change/omit *_EXPOSE in env/docker.env"; exit 1; }
echo "ports ok"
`.trim();
}
