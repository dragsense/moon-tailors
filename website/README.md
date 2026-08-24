# Website (marketing)

Astro SSG landing for Moon Tailors. The **product app login** lives on the client (`/`); this package is the public marketing surface.

## Structure

```txt
src/
  config/site.ts            # PUBLIC_* brand + app URLs (login path default `/`)
  lib/prefs.ts              # theme + language (same keys as client)
  lib/app-environment.ts    # PUBLIC_ENV banner (non-prod)
  components/               # SiteChrome, EnvironmentBanner, SitePrefsProvider
  locales/                  # en / ur
  layouts/global/           # Base HTML shell
  pages/                    # File routes — thin (index → landing)
  features/landing/         # LandingPage island
    components/             # hero, stack, features, modules, monorepo, cta
  styles/global.css         # Tokens + landing bands
```

## Landing sections

1. **Hero** — brand-first, one headline, CTA → client login  
2. **Stack** — React Router, Nest, Zod, Astro, MCP, Docker, …  
3. **Features** — contracts, ops, RBAC, auth, query/ACL, `server/common`, MCP, website, deploy  
4. **Modules** — dashboard, tasks, users, chat, cameras, billing, files, sms, email, AI, API keys, availability, settings, notifications, theme  
5. **Monorepo** — contracts / server / client / website / mcp / docker  
6. **CTA** — open the app  

## Theme + language

Same localStorage keys as the client:

| Key | Values |
|---|---|
| `theme` | `light` \| `dark` \| `system` |
| `app.language` | `en` \| `ur` (RTL when `ur`) |

## Env

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_NAME` | Brand (hero) |
| `PUBLIC_ENV` | `development` \| `staging` — env banner |
| `PUBLIC_SITE_TAGLINE` | Optional EN headline override |
| `PUBLIC_SITE_DESCRIPTION` | Optional EN support override |
| `PUBLIC_APP_URL` | Client origin (default `http://localhost:8088/app`) |
| `PUBLIC_APP_LOGIN_PATH` | Default `/` (client login) |

```bash
pnpm --filter @moon-tailors/website dev      # http://localhost:4321
pnpm --filter @moon-tailors/website build
```

Copy `env/website.env.example` → `env/website.env` locally. Remote hosts use `env/<host>/website.env` (see [ENV.md](../docs/ENV.md)).

`astro.config.mjs` uses `output: "static"`. Deploy (`website.mode=docker`) builds HTML into `website/dist`; the Docker **gateway** serves `/`. There is no website container on the VPS. Local Docker still runs `astro dev`. See [DEPLOY.md](../docs/DEPLOY.md).
