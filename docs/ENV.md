# Environment variables (secrets stay off git)

## Files

| File | Git | Purpose |
|---|---|---|
| `env/docker.env` | **ignored** | Local compose ports / volume names (this machine) |
| `env/docker.env.example` | committed | Copied to `docker.env` if missing |
| `env/server.env` | **ignored** | Nest API (this machine) |
| `env/client.env` | **ignored** | Vite (this machine) |
| `env/mcp.env` | **ignored** | MCP (this machine) |
| `env/website.env` | **ignored** | Astro `PUBLIC_*` (this machine) |
| `env/staging/*.env` | **ignored** | Staging VPS — uploaded by `pnpm remote` |
| `env/staging/*.env.example` | committed | Copied to `env/staging/*.env` if missing |
| `docker/environments.json` | **committed** | Compose profiles: **local** (laptop) and **staging** |

```bash
pnpm tpl                   # → Bootstrap copies *.env.example if missing
```

Laptop Docker uses **local**. The only remote environment is **staging**.

## Docker stack name (container group)

In `env/docker.env` (local) or `env/staging/docker.env` (staging VPS):

```bash
COMPOSE_PROJECT_NAME=moon-tailors
POSTGRES_VOLUME_NAME=moon_tailors_postgres_data
UPLOADS_VOLUME_NAME=moon_tailors_uploads
```

Containers become `moon-tailors-server`, `moon-tailors-postgres`, `moon-tailors-redis`, … Pin **volume names** so swapping containers does not create a new empty database. Staging must use different names (`moon_tailors_staging_postgres_data`).

Only **`GATEWAY_EXPOSE`** is published on the host. Do not set `SERVER_EXPOSE`, `CLIENT_EXPOSE`, `WEBSITE_EXPOSE`, or `MCP_EXPOSE` unless you need them — traffic goes through the gateway (`/`, `/app/`, `/server/`, `/mcp/`).

## Local credentials

Edit **gitignored** files only:

```bash
nano env/docker.env        # Postgres password, ports, stack name, volume names
nano env/server.env        # Nest API (local)
nano env/client.env        # Vite local
```

After changing `COMPOSE_PROJECT_NAME` or ports in `docker.env`:

```bash
pnpm tpl stop
pnpm tpl start
```

## How env is loaded

Do **not** use `client/.env`, `website/.env`, or `server/.env`. One file per app under `env/`.

```txt
Host:     env/server.env   (or env/staging/server.env)
            │  volume → /app/env/server.env
            │  ENV_FILE
Nest:     process.env

Host:     env/client.env   (or env/staging/client.env)
            │  compose mounts at /app/env/client.env
            │  client/vite.config.ts loadClientEnv()
Browser:  import.meta.env.VITE_*

Host:     env/website.env  (or env/staging/website.env)
            │  compose mounts at /app/env/website.env
            │  website/astro.config.mjs loadWebsiteEnv()
Site:     import.meta.env.PUBLIC_*
```

On the VPS, `environments.json` may say `env/staging/client.env`; compose still bind-mounts it as **`/app/env/client.env`** inside the image, so Vite/Astro keep looking at that container path. Deploy copies laptop `env/staging/server.env` → VPS `…/env/staging/server.env` (same relative path). Do not flatten to `env/server.env` on the host.

### Nest (`env/server.env`)

| Key | Role |
|---|---|
| `JWT_SECRET` | Signs the access JWT (min 32 chars) |
| `JWT_ACCESS_TTL_SEC` | Cookie JWT lifetime in seconds (default **604800** / 7 days) |
| `ACCESS_COOKIE_NAME` | HttpOnly cookie name (default `access_token`) |
| `CSRF_ENABLED` | Cookie↔header CSRF on mutating `/api` (typically on in staging) |
| `COOKIE_SECRET` | Signs the CSRF cookie |

Login sets an HttpOnly JWT cookie on `{SERVER_PUBLIC_PATH}/api` (e.g. `/server/api`). The JSON body is `{ user, message }` — the token is never returned to JavaScript. There is **no refresh token**. Logout clears the access cookie. Browser clients use `withCredentials`; non-browser clients may send `Authorization: Bearer`.

### Vite (`env/client.env`)

| Key | Role |
|---|---|
| `VITE_APP_ENV` | `development` (laptop) or `staging` (VPS) — client env banner (baked at SPA build) |
| `VITE_API_URL` | gateway API (`http://localhost:8088/server/api`) |
| `CLIENT_SSR` | local Vite SSR toggle |

Rebuild/restart the client after changing public vars. Docker/remote: the banner is compiled into the SPA — redeploy **client**.

### Environment banner

Non-production: top bar + `[env]` in the tab title.

```bash
# local
VITE_APP_ENV=development          # env/client.env
PUBLIC_ENV=development            # env/website.env

# staging VPS (copied by pnpm remote)
VITE_APP_ENV=staging              # env/staging/client.env
PUBLIC_ENV=staging                # env/staging/website.env
```

Full table: [DEPLOY.md](DEPLOY.md#environment-banner-docker--deploy).

### Astro (`env/website.env`)

| Key | Role |
|---|---|
| `PUBLIC_ENV` | same values as `VITE_APP_ENV` — website env banner (baked at Astro build) |
| `PUBLIC_APP_ENV` | optional alias for `PUBLIC_ENV` |
| `PUBLIC_APP_URL` | gateway origin + `/app` |
| `PUBLIC_API_URL` | gateway API (`http://localhost:8088/server/api`) — landing session check |

Compose also injects `DATABASE_URL` from `POSTGRES_*` in `docker.env` so DB user/password stay in one place. Redis is injected as `REDIS_URL=redis://redis:6379`.

## Staging / remote

Host name matches `environments.json` (`staging`). **Do not point staging at `env/docker.env`** — Deploy would upload your laptop ports and secrets.

```txt
env/docker.env                 local laptop only
env/staging/docker.env         staging VPS (gitignored)
env/staging/server.env
env/staging/client.env
env/staging/mcp.env
env/staging/website.env
env/staging/*.env.example      committed templates
```

`.gitignore`:

```
env/*.env
env/**/*.env
!env/*.env.example
!env/**/*.env.example
```

```json
"staging": {
  "projectName": "moon-tailors-staging",
  "dockerEnv": "env/staging/docker.env",
  "server": { "env": "env/staging/server.env", "needs": ["postgres", "redis"] },
  "client": { "clientMode": "nginx", "env": "env/staging/client.env" },
  "website": { "mode": "docker", "env": "env/staging/website.env" }
}
```

Set `clientMode` on **`docker/environments.json`**, not `hosts.json` (unless you need a per-host override). Modes and what deploy starts: [DEPLOY.md](DEPLOY.md).

```bash
nano env/staging/server.env
pnpm remote --host staging env
```

Host nginx proxies `:80/:443` → `127.0.0.1:${GATEWAY_EXPOSE}` (often `8088`).

## Docker network hostnames (local)

```bash
DATABASE_URL=postgres://USER:PASS@postgres:5432/DB
REDIS_URL=redis://redis:6379
```

## Anti-pattern

```bash
# BAD — do not copy secrets into the image
cp env/server.env server/.env
docker compose build
```
