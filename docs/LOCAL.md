# Local development — profile-based Docker

## One command

```bash
pnpm tpl
```

Asks what you want to do (bootstrap, start, stop, clean, remote, …).

Skip the menu when you already know:

```bash
pnpm start
pnpm stop
pnpm logs
pnpm remote              # deploy + SSH host control
pnpm bootstrap --all
pnpm bootstrap --add server
pnpm bootstrap --fresh
```

> **Do not** use `pnpm setup`, `pnpm restart`, `pnpm pkg`, or `pnpm deploy` — those are reserved by pnpm/npm. Use `pnpm bootstrap`, `pnpm reload`, `pnpm add-pkg`, and `pnpm remote`.

Local Docker uses the **local** block in `docker/environments.json` and `docker/compose.yml` (mailpit via `server.needs`; bind mounts + `dev` build target).

**Watch (server / client / mcp / website):** compose sets `WATCHPACK_POLLING` + `CHOKIDAR_USEPOLLING` so create/edit/**delete** on the host rebuild under Docker Desktop / WSL (inotify is often dropped). Each app’s `dev` script clears package caches (`.cache` / `.vite` / `.astro` / Nest `dist`) so stale deleted modules cannot linger.

### Start / Stop / Logs

| Command | Behavior |
|---|---|
| **Start** | `docker compose up -d`, print URLs, **exit**. Containers keep running if you close the terminal. |
| **Logs** | Multi-select services, follow with `logs -f`. **Ctrl+C only detaches** — never stops containers. |
| **Stop** | Multi-select which apps to **stop** (containers kept). `all` stops every running service including postgres/redis/mailpit. Does **not** remove containers — use **Clean** for that. |

```bash
pnpm start              # ask / use profile, then detach
pnpm logs               # ask which → follow
pnpm logs server client
pnpm stop               # ask which
pnpm stop server
pnpm stop all           # stop everything running (containers kept)
```

Website is Docker locally (Astro in the `website` container → gateway `/`). Prod `mode: "docker"` builds static HTML for the **gateway** (no website container).

### Environment banner (non-prod only)

Shown on **client** and **website** (local Docker and remote).

| App | Env file | Variable |
|---|---|---|
| Client | `env/client.env` (local) or `env/<host>/client.env` | `VITE_APP_ENV` |
| Website | `env/website.env` or `env/<host>/website.env` | `PUBLIC_ENV` |

Values: `development` (laptop) or `staging` (VPS). Local Vite/Astro default to **development** if unset. After changing a remote file, redeploy that app so the value is baked into the static build.

- **staging** — sticky top strip + `[STAGING]` document title
- **development** — sticky top strip + `[DEVELOPMENT]` document title

See [DEPLOY.md](DEPLOY.md#environment-banner-docker--deploy).

### Gateway (single host port)

One `gateway` container is the **only** published HTTP port (local **`:8088`**, not 80). Other services use Docker `expose` (internal) only.

| URL | Service |
|---|---|
| http://localhost:8088/ | website |
| http://localhost:8088/app/ | client |
| http://localhost:8088/server/api/ | Nest API |
| http://localhost:8088/server/uploads/ | Nest public files |
| http://localhost:8088/server/api/docs | Scalar |
| http://localhost:8088/mcp/ | mcp |
| http://localhost:8088/mailpit/ | Mailpit UI |
| http://localhost:8088/hub/ | service index |

Nginx templates (picked from `clientMode`; local always uses the first):

| Template | When |
|---|---|
| `nginx-gateway.conf.template` | Local (Vite + Astro reverse proxy) |
| `nginx-gateway.static.conf.template` | Prod **nginx** — `/app/` files on the gateway; Nest is API only |
| `nginx-gateway.nest.conf.template` | Prod **nest** (`/app/` → server) or **ssr** (`/app/` → client). Same file; upstream differs. |

Website: local Astro **dev** container. Deploy builds **static HTML** (`website/dist`); the gateway serves `/` — no website container. That is SSG, not `clientMode=ssr`.

Set `GATEWAY_EXPOSE=80` on a VPS if you want standard HTTP. Optional domains: `GATEWAY_DOMAIN=example.com` → `api.` / `app.` / `mcp.` / `www.`

If a **host / main nginx** sits in front of the Docker gateway and Docker (or the gateway container) is down, only the host can show an error page. Install [`host-nginx/gateway-down.html`](../host-nginx/gateway-down.html) onto the host (never inside a container):

```bash
sudo mkdir -p /var/www/moon-tailors
sudo cp host-nginx/gateway-down.html /var/www/moon-tailors/
```

Wire it with [`host-nginx/nginx-snippet.conf.example`](../host-nginx/nginx-snippet.conf.example). Per-service downtime *inside* a running gateway still uses `docker/gateway-www/errors/*`.

### Add npm package

```bash
pnpm add-pkg                 # interactive
pnpm add-pkg client axios    # non-interactive
```

Installs on the **host**, then syncs the Docker **named** `node_modules` volume
(`client_pkg_nm`, `server_pkg_nm`, …). Source code and lockfile are bind-mounted;
`node_modules` is intentionally a named volume so host/container installs do not
fight — without the sync step, new packages would be missing inside Docker.

### Bootstrap

1. Asks what you need  
2. Creates only matching env files  
3. Filtered `pnpm install`  
4. Builds only those Docker images  
5. **Does not start** anything  
6. Updates `.profile` and hides unrelated folders in the Cursor explorer:
   - app folders not in the profile
   - `contracts` only if **server** or **client** is selected
   - `docker/` + `env/` only if a Docker app (server/client/mcp/website) is selected
   - inside `env/`, only files for selected services (e.g. no `*mcp*` if MCP is off)

Folders are only **hidden in the editor**, not deleted. Change profile with `pnpm bootstrap` to show them again. 

### Clean / start over

```bash
pnpm clean                 # ask which profile services (+ depth)
pnpm clean client mcp      # only those; keep shared if others remain
pnpm clean --all           # full wipe
pnpm bootstrap --fresh     # wipe then bootstrap
```

Clean is **service-aware** and lists **all** services (not only `.profile`), so you can wipe leftover client images even after client was removed from the profile. Shared things (`node:22-alpine`, contracts, root `node_modules`, `env/docker.env`) stay if something still in the profile needs them.

## Deploy

```bash
pnpm remote
# → Deploy
```

Asks host + apps. Auto-prepares remote (folder/git/env/Docker if missing).

Remote ops: `pnpm remote` — see [DEPLOY.md](DEPLOY.md#remote-control-status--deploy--start--reload--stop--logs--clean--pull).

Docker envs (local laptop + staging): [`docker/environments.json`](../docker/environments.json) — see [DEPLOY.md](DEPLOY.md).

## URLs (when running)

| URL | Service |
|---|---|
| http://localhost:8088/ | Website |
| http://localhost:8088/app/ | Client |
| http://localhost:8088/server/api | Server |
| http://localhost:8088/server/api/docs | Scalar |
| http://localhost:8088/mcp | MCP |
| http://localhost:8088/mailpit/ | Mailpit |

## Contracts live reload

`@moon-tailors/contracts` uses a package.json **`development` export condition** that points at `contracts/src`. In local/dev:

- **Client (Vite)** resolves that condition (and TypeScript `customConditions`) so edits HMR-update immediately.
- **Server (Nest webpack)** uses the same condition and **bundles** contracts from source, so Nest rebuilds when contracts change.

You do **not** need `pnpm --filter @moon-tailors/contracts build` while developing. Production/CI still builds `contracts/dist`; Nest production builds keep contracts external and load `dist`.

## Client deploy modes (not used in local start)

See [DEPLOY.md](DEPLOY.md) for the full table. Short version:

| Mode | `/app/` | Long-running client? |
|---|---|---|
| **nginx** | Gateway files | No |
| **nest** | Nest (SPA bind-mounted; client deploy does not recreate the server) | No |
| **ssr** | Client container (`react-router-serve`) | Yes |
| **cdn** | External host | No |
