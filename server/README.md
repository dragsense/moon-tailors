# Backend

NestJS API validated by Zod schemas from `@template/contracts`. Postgres + TypeORM, `EntityService` CRUD, tenant/owner ACL, OTP auth.

## Layout

```txt
src/
  common/           Shared platform (query, EntityService, base users/business/chat/…)
  modules/          Feature modules (auth, users, tasks, chat, billing, …)
  config/           Env validation + Nest config
```

See root [README.md](../README.md) for the full `common/` and `modules/` inventory.

## Query model

- Clients may pass `_select` / `_relations` for any real path (nested OK).
- Secrets: `restrictedFields` denylist (e.g. `passwordHash`, `keyHash`).
- `searchable` / filters / `sortable` support nested paths (`sender.firstName`).
- Tenant scope always; default owner ACL for STAFF/MEMBER.

## Local

```bash
pnpm tpl start                 # via monorepo menu
# API  http://localhost:8088/server/api
# Docs http://localhost:8088/server/api/docs
```
