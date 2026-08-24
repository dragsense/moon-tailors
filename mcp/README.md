# MCP server

NestJS MCP (HTTP + stdio) that mirrors **server modules** and **client feature APIs**. Part of the monorepo alongside `server/`, `client/`, and `website/` — see root [README.md](../README.md).

## Structure

```txt
src/
  config/                 # MCP_PORT, MCP_API_BASE_URL, MCP_API_KEY
  common/
    api/                  # ApiClient + BaseApiService (like client BaseService)
    mcp/                  # McpRegistrar, textResult / jsonResult
  modules/
    transport/            # HTTP /mcp + registry bootstrap
    platform/             # demo tools / resources / prompts
    health/               # api/ + tools/ → Nest GET /health
    tasks/                # api/ + tools/ → Nest /tasks (contracts types)
    # extend with billing, users, … same pattern as client features
```

## Adding a domain tool

Same flow as client + server:

1. Contracts types already exist (or add them).
2. `modules/<feature>/api/<feature>.service.ts` extends `BaseApiService`.
3. `modules/<feature>/tools/<feature>.tools.ts` implements `McpRegistrar`.
4. Export from a Nest module; register the tools service in `McpRegistryService`.

```ts
// modules/billing/api/billing.service.ts
class BillingApiService extends BaseApiService {
  constructor(api: ApiClient) { super(api, "/billing"); }
  list(query) { return this.get(query); }
}
```

## Env

| Variable | Purpose |
|---|---|
| `MCP_PORT` | HTTP port (default `4000`) |
| `MCP_API_BASE_URL` | Nest API root including `/api` |
| `MCP_API_KEY` | Optional `x-api-key` for protected tools |
| `MCP_SERVER_NAME` | MCP server name |
| `MCP_SERVER_VERSION` | MCP server version |

See `env/mcp.env.example`.

## Transports

```bash
pnpm --filter @moon-tailors/mcp dev          # http://localhost:4000/mcp
pnpm --filter @moon-tailors/mcp start:stdio  # Cursor / Claude stdio
```
