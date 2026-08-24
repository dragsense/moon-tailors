# Deploy

```bash
pnpm remote
# → Deploy
```

Or: `pnpm tpl` → Remote → Deploy

Asks:
1. **Which host?** — prints **git branch** from `deploy/hosts.json` (host name is not the branch)
2. **Remote action?** — GitHub warning only for **Deploy** and **Pull** (right after you pick that action)
3. **What?** one or more: server / client / mcp / website / all
4. Env sync / image prune / volumes / start (Deploy only — first three default No)

**Status / Start / Stop / Logs / Clean** only inspect or control Docker. They do **not** `mkdir` the host path. Creating `path` + env files happens on **Deploy** (and env sync on Env/Pull).

Host needs `docker` and Compose v2 (`docker compose version`). Deploy only checks; it does not install Docker.

Host prep: create the app folder (with `sudo -n chown` if the SSH user cannot write it), **git clone or pull first**, then copy `env/<host>/*.env` from the laptop to the **same relative paths** on the VPS, then check Docker.

If passwordless sudo is not available:

```bash
sudo mkdir -p /path/from/hosts.json
sudo chown -R ubuntu:ubuntu /path/from/hosts.json
```

Needs **Docker Compose v2** (`docker compose`). Engine-only installs fail with `unknown flag: --env-file`.

| Config | Role |
|---|---|
| `deploy/hosts.json` | SSH hosts — name matches `environments.<name>` (env defaults to host name) |
| `docker/environments.json` | Per env: nested `server` / `client` / `mcp` / `website` (+ env paths). Deploy multi-picks from those |
| `docker/compose.yml` | Single compose (full stack) |
| `scripts/deploy.mjs` | Deploy entry |

Env files: [ENV.md](ENV.md) (`env/docker.env` is laptop-only; remote uses `env/staging/…`).

---

## GitHub without logging in on the server

Remote `git clone` / sync uses **SSH agent forwarding** (`ssh -A`). Your **local** GitHub key is used; it is **not** copied to the VPS.

On the host, **clone/pull first**, then copy gitignored env files (same paths as `environments.json`). Do not mkdir `env/` before clone.

In `deploy/hosts.json`:

| Field | Meaning |
|---|---|
| `branch` | Git branch the VPS resets to (`origin/<branch>`). Host **name** is not the branch unless you set this. |
| `path` | App checkout on the VPS |
| `gitUrl` | Optional; otherwise laptop `git remote origin` |
| `sshKey` | Key to log into the **VPS** |
| `githubSshKey` | Local key for **GitHub** (loaded into ssh-agent, then forwarded) |

```json
"sshKey": "~/.ssh/id_ed25519",
"githubSshKey": "~/.ssh/id_ed25519",
"gitUrl": "git@github.com:ORG/REPO.git"
```

- Repo remote on the server must be SSH (`git@github.com:…`), not HTTPS.
- Disable forwarding: `"forwardAgent": false`.

---

## Public paths (every host)

The Docker **gateway** is the only published HTTP port. Paths do not change by mode — only **who answers** `/app/` does.

| Path | What it is |
|---|---|
| `/` | Marketing site (Astro **static HTML**) |
| `/app/` | Product UI (React) |
| `/server/` | Nest API (`/api`, `/uploads`, Scalar at `/api/docs`) |
| `/api/` `/uploads/` | Same as `/server/api/` and `/server/uploads/` (shorter aliases) |
| `/mcp/` `/mailpit/` | Other services |

**Local** (`pnpm tpl start`) ignores `clientMode`. Gateway uses `nginx-gateway.conf.template`. **Client** and **website** containers run (Vite + Astro `dev`).

---

## Environment banner (Docker / deploy)

Staging (and local) stacks show a **top bar** + `[env]` document title.

Baked in at **image build** (Vite `define` / Astro `PUBLIC_*`). After changing these, redeploy **client** and/or **website**.

| App | File (per host) | Variable | UI |
|---|---|---|---|
| Client (`/app/`) | `env/<host>/client.env` | `VITE_APP_ENV` | `EnvironmentBanner` in the app shells |
| Website (`/`) | `env/<host>/website.env` | `PUBLIC_ENV` (alias `PUBLIC_APP_ENV`) | Same bar on the Astro landing |

This repo uses **local** (`development` banner) and **staging**. Aliases: `dev`/`local` → development, `stage` → staging.

Examples already in git: `env/staging/client.env.example` (`VITE_APP_ENV=staging`), `env/staging/website.env.example` (`PUBLIC_ENV=staging`). Local files default to `development`.

Banner height is `32px` (`--env-banner-height`). Links on the bar: Hub `/hub/`, website `/`, Mailpit `/mailpit/`, Scalar `/server/api/docs`, Bull Board `/server/api/queues`, API `/server/api/` (client); website bar also links to `/app/`.

This is **not** `clientMode`. `clientMode` chooses who serves `/app/`; the banner only labels which **host/env** you are on.

---

## Client deploy modes (`clientMode`)

Set on **`docker/environments.json` → `client.clientMode`**. Do **not** duplicate it in `deploy/hosts.json` unless you need a per-host override (`hosts.json` / `--client-mode` win). Default in this repo: **nginx**.

`nginx`, `nest`, and `cdn` all use the same SPA image (`client.Dockerfile` target **`build`**, `CLIENT_SSR=false`). **ssr** is different: a long-running **client** container (`react-router-serve`). Nest does **not** compile the client; `server.Dockerfile` is API-only (`runtime`).

In **prod/staging** (not local), compose always bind-mounts `client/build/client` → `/app/client-static` on the **server** and sets `CLIENT_STATIC_DIR`. Nest uses that folder. Nginx/ssr still serve `/app/` from the gateway / client container; the mount is unused for browsers.

| | **nginx** | **ssr** | **nest** | **cdn** |
|---|---|---|---|---|
| **Who serves `/app/`** | Gateway files (`client/build/client`) | **client** container | **server** (SPA at `/app`) | Your CDN |
| **Client container?** | No | **Yes** | No | No |
| **Gateway template** | `nginx-gateway.static.conf.template` | `nginx-gateway.nest.conf.template` (`GATEWAY_APP_UPSTREAM=client:…`) | Same nest template (`upstream=server:…`) | n/a |
| **Deploy “client”** | `compose build client` → extract to host → recreate **gateway** only | Build + `up --no-deps --force-recreate` **client** and **gateway** | Same extract as nginx → recreate **gateway** only (**do not** rebuild or recreate Nest) | Laptop `pnpm` build + upload |
| **Start “client”** | Starts **gateway** | Starts **client** (+ gateway) | Starts **server** (+ gateway) | n/a |
| **Prune on deploy client** | Skip images; drop leftover `*-client` container if present (keep image) | Same (container removed then started again if you chose start) | Same | n/a |

```json
"client": { "clientMode": "nginx", "env": "env/staging/client.env" }
```

Local Vite SSR toggle: `CLIENT_SSR` in `env/client.env`. Deploy `ssr` forces `CLIENT_SSR=true`.

The nest-named gateway file is **proxy `/app/` to a Node process**. Nest and SSR share it; they are not the same mode. SSR is a separate client process. Nest is the API process serving static files.

---

## Website (`website.mode`)

Astro is **`output: "static"`** (HTML at build time — SEO without a website Node process). That is **not** `clientMode=ssr`.

**Local always Docker** (Astro `dev`). **Deploy default = Docker**.

| Mode | What ships |
|---|---|
| **docker** (default) | `compose build website` → extract `website/dist` → recreate **gateway** only (no website container) |
| **cdn** | Build on laptop + print upload instructions |

**Start “website”** remaps to **gateway** (there is no website container on deploy).

---

## Deploy targets (what actually runs)

Multi-app deploy prepares the VPS **once** (folder / git / Docker). Later apps pass `--skip-prepare`.

Before a non-CDN **client** deploy, any leftover `*-client` container is **removed** (image kept) so an old SSR process cannot keep running after you switch to nginx/nest.

| You pick | Build | If you also Start |
|---|---|---|
| **server** | `compose build server` (`runtime` — API only) | Infra if needed; `--no-deps --force-recreate` **server** + **gateway**. Optional TypeORM (`/app/server/dist/database/data-source.js`) |
| **client** (nginx / nest) | Client SPA image + extract to `client/build/client` | Recreate **gateway** only |
| **client** (ssr) | Client `ssr` image | Recreate **client** + **gateway** (`--no-deps`) so `/app/` is not left pointing at Nest |
| **mcp** | `compose build mcp` | **mcp** + gateway |
| **website** (docker) | Website image + extract to `website/dist` | Recreate **gateway** only |
| **all** | Each of the above in turn | Same per target |

---

## Remote control

```bash
pnpm remote                              # ask host + action
pnpm remote --host staging status
pnpm remote --host staging stop server
pnpm remote --host staging logs client
pnpm remote --host staging clean
```

**Deploy** — git sync → build (+ optional env sync / prune / start). Asks:
- Branch up to date on GitHub?
- Sync env files first? `[y/N]` (default No — keeps remote `env/`)
- Prune old images first? `[y/N]` (default No — keeps Docker cache)
- Remove volumes too? `[y/N]` (default No; ignored unless image prune is enabled)
- Start containers after? `[y/N]` (default No — build only)
- If you start **server**: run TypeORM migrations? `[y/N]` (default No). Uses `/app/server/dist/database/data-source.js`. Or later: `pnpm migrate`.

Multi-app deploy (e.g. server + client + website) prepares the VPS **once**. Later apps pass `--skip-prepare`. See **Deploy targets** above for what each mode starts.

**Reload** — sync env + recreate containers (same images). Pick **gateway** alone to reload nginx routing without touching server, client, or infra.

```bash
pnpm remote --host staging env
pnpm reload gateway                    # local Docker profile
node scripts/remote.mjs --host staging --action pull
node scripts/remote.mjs --host staging --action reload gateway
```

Gateway nginx configs are **bind-mounted** from `docker/nginx-gateway.*.conf.template` — no image build. After editing templates on the host (via **pull**), recreate the gateway container only. Gateway-only reload uses `docker compose up -d --no-deps --force-recreate gateway`. Reloading server/client with gateway as a side effect does **not** use `--no-deps`.

| Action | Behavior |
|---|---|
| **status** | containers, images, volumes, networks, disk |
| **deploy** | pull + build (+ optional env sync, image prune, volumes, start) |
| **start** | `up -d`. **client** remaps: nginx → gateway; nest → server; ssr → client |
| **reload** / **env** | sync env + recreate (same images); **gateway** → recreate edge only |
| **pull** | git sync only (keep `env/`) |
| **stop** | stop only (containers kept) |
| **logs** | follow logs |
| **clean** | pick apps + layers (`env/` never removed) |

Push to GitHub before Deploy. Host resets to origin; **`env/` is kept**.

> **Note:** bare `pnpm deploy` is reserved by pnpm — use `pnpm remote` → Deploy.

---

## Direct (optional)

```bash
node scripts/deploy.mjs --host staging --target server
node scripts/deploy.mjs --target website
node scripts/deploy.mjs --target client --client-mode nginx
```

Add a new environment as `environments.<name>` matching `hosts.json`, with **`env/<name>/`** files — never `env/docker.env` for a remote host.

```json
"staging": {
  "projectName": "moon-tailors-staging",
  "dockerEnv": "env/staging/docker.env",
  "server": {
    "buildTarget": "runtime",
    "nodeEnv": "staging",
    "restart": "unless-stopped",
    "env": "env/staging/server.env",
    "needs": ["postgres", "redis", "mailpit"]
  },
  "client": {
    "clientMode": "nginx",
    "env": "env/staging/client.env"
  },
  "website": {
    "mode": "docker",
    "env": "env/staging/website.env"
  }
}
```

Omit an app key to hide it from deploy multi-pick. `server.needs` pulls infra. After git sync, deploy copies only the env files listed for that host.
