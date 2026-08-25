# Moon Tailors (monorepo)

Contracts-first starter: NestJS API, React Router app (**login at `/`**), Astro marketing site, shared Zod contracts, and Docker/SSH deploy.

## Package map

```txt
moon-tailors/
  contracts/          Shared Zod schemas, enums, I*/E*/T* types, list helpers
  server/             NestJS API + TypeORM + EntityService / query / ACL
    src/
      common/         Shared platform (see below)
      modules/        Feature modules (auth, users, customers, orders, …)
      config/         Nest config + env validation
  client/             React Router v7 SPA — product UI (login at `/`)
    app/
      config/         Routes, nav, titles, levels, permissions
      routes/guards/  Guest / auth / access
      pages/          Thin public + protected screens
      features/       Ops packs, forms, API clients per domain
      layouts/        App / auth / blank shells
      components/     UI + layout primitives
      ops/            createOps + OpsProvider
  website/            Astro SSG marketing landing
    src/
      pages/          Astro routes (index, 404)
      layouts/        Base.astro + global shell / header / footer
      features/       auth (session + AuthButton) + landing hero
      components/     ui (shadcn) + layout-ui (toggles, banner)
      config/         site / routes / nav (PUBLIC_* )
  cli/                `pnpm tpl` / bootstrap / remote menus
  docker/             compose.yml + environments.json
  deploy/             hosts.json (SSH targets)
  env/                Runtime secrets (gitignored). Local: `env/*.env`. Remote: `env/<host>/*.env`
  scripts/            Deploy + docker-env loader
  docs/               LOCAL / DEPLOY / ENV / NAMING
```

## Local URLs

Only the **gateway** is published on the host (default `:8088`). Everything else is Docker-internal.

| URL | Service |
|---|---|
| http://localhost:8088/ | Website (landing) |
| http://localhost:8088/app/ | Client (**login** at `/app/`) |
| http://localhost:8088/server/api | Server |
| http://localhost:8088/server/api/docs | Scalar API docs |

```bash
pnpm tpl                   # menu: bootstrap / start / stop / remote / …
pnpm tpl start             # skip menu
pnpm remote                # deploy + SSH host control
```

> Do **not** use `pnpm setup`, `pnpm restart`, `pnpm pkg`, or `pnpm deploy` (reserved). Use `pnpm bootstrap`, `pnpm reload`, `pnpm add-pkg`, `pnpm remote`.

## App responsibilities

| Package | Role |
|---|---|
| **website** | Public landing — shop hero + Login / Open shop; CTAs → client `/` or `/dashboard` |
| **client** | Product app — `/` is always login; home is `/dashboard` (stats + customers). Account, reset password, and settings live in the top-right menu. |
| **server** | REST + WebSocket — tenant/owner ACL, permissions, password auth, EntityService |
| **contracts** | Single source of truth for request/response shapes (`I*` / `E*` / `T*`) |

---

## Server — `src/common/` (shared platform)

| Area | What it provides |
|---|---|
| **database** | `EntityService` bind / list / get / create / update / soft+hard delete |
| **query** | `_relations` / `_select`, nested paths, `restrictedFields`, searchable + filters + sort, tenant + owner ACL |
| **base/users** | Users, password hashing, platform-owner seed |
| **base/business** | Businesses |
| **base/chat** | Chats, messages, participants (realtime-ready) |
| **base/permissions** | Resource permissions + user grants |
| **base/notifications** | In-app notifications, Web Push, FCM |
| **base/settings** | Key/value entity settings |
| **auth** | Guards, JWT/session helpers used by modules |
| **email** | Outbound mail + sent-email log |
| **payment-processors** / **ai-processors** | Processor catalogs |
| **schedule** | Cron / scheduled actions per tenant |
| **activity-logs** | Request/module activity audit |
| **encryption** | Field-level DB encryption helpers |
| **cache** / **cluster** / **gateways** | Infra helpers |
| **security** / **validation** / **logging** / **docs** | Cross-cutting |

## Server — `src/modules/` (features)

`auth` · `users` · `customers` · `orders` · `measurements` · `garment-types` · `business` · `user-settings` · `dashboard`

Query model: clients may request any real `_select` / `_relations` path; secrets use `restrictedFields`. Nested searchable/filters/sort supported (`sender.firstName`, `participants.user.email`).

---

## Client — `app/features/`

| Feature | Notes |
|---|---|
| **auth** | Login at `/` (email + password). JWT in an HttpOnly cookie; client sends it with `withCredentials` |
| **dashboard** | Level home after login |
| **customers** / **orders** | Shop surfaces |
| **settings** | Prefs (appearance + date/time) |

Routing: `client/app/config/routes.config.ts` · tree: `client/app/routes.ts`  
Guards: guest → auth shell (`/`); session → access → app shell.  
UI: ops packs (`createOps`), SchemaForm from contracts, shadcn + Tailwind.

---

## Website — marketing (`website/`)

Astro SSG + React islands (`output: "static"`). Landing HTML is built at deploy; the **gateway** serves `/` (no website container). Local still runs Astro `dev` in Docker.  
Theme + language (`en` / `ur` RTL) share localStorage keys with the client. CTAs open the client at `/` (login).

---

## Docs

- [docs/LOCAL.md](docs/LOCAL.md)
- [docs/DEPLOY.md](docs/DEPLOY.md)
- [docs/ENV.md](docs/ENV.md)
- [docs/NAMING.md](docs/NAMING.md)
- [client/README.md](client/README.md)
- [server/README.md](server/README.md)
- [website/README.md](website/README.md)
- [contracts/README.md](contracts/README.md)
