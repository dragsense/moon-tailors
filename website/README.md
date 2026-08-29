# Website (marketing)

Astro SSG landing for Moon Tailors. The **product app login** lives on the client (`/`); this package is the public marketing surface.

## Structure

Same split as the client: pages own screens, layouts wrap them, `components/` is shareable UI, features hold domain API/UI (not pages).

```txt
src/
  config/                 # site.config + routes.config + nav.config
  hooks/                  # theme, i18n
  lib/                    # prefs, cn, app-environment
  components/
    ui/                   # shadcn
    layout-ui/            # ThemeToggle, LanguageToggle, EnvironmentBanner
  layouts/
    Base.astro            # html / head
    global/               # SiteShell, header, footer (used at page level)
  features/
    auth/                 # session API, useSession, AuthButton
    landing/              # LandingHero
  pages/
    index.astro           # landing (SiteShell + hero)
    404.astro             # not found (SiteShell + copy)

  locales/
  styles/global.css
```

Astro route files are the screens. They wrap static `SiteShell` around page content. Only `AuthButton` uses `client:load`; theme/language toggles use `client:idle`. Hero and footer stay static HTML.

## Landing

One screen, no page scroll: overlay **header** (M mark + prefs + login) and **footer** on a full-bleed hero.

## Theme + language

| Key | Values |
|---|---|
| `theme` | `light` \| `dark` \| `system` |
| `app.language` | `en` \| `ur` (RTL when `ur`) |

## Env

| Variable | Purpose |
|---|---|
| `PUBLIC_SITE_NAME` | Brand |
| `PUBLIC_ENV` | `development` \| `production` — env banner (hidden in production) |
| `PUBLIC_SITE_TAGLINE` | Optional EN headline override |
| `PUBLIC_SITE_DESCRIPTION` | Optional EN support override |
| `PUBLIC_APP_URL` | Client origin (default `http://localhost:8088/app`) |

```bash
pnpm --filter @moon-tailors/website dev      # http://localhost:4321
pnpm --filter @moon-tailors/website build
```

Copy `env/website.env.example` → `env/website.env` locally. Remote hosts use `env/<host>/website.env` (see [ENV.md](../docs/ENV.md)).
