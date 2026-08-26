# Naming conventions

Keep names predictable across contracts, API, and UI.

## Prefixes

| Prefix | Kind | Example | Where |
|---|---|---|---|
| `E` | Enum | `EOrderStatus` | `contracts/src/features/{feature}/enum.ts` |
| `I` | Interface (entity / response) | `IOrder`, `ILoginResponse` | `contracts/src/features/{feature}/interface.ts` |
| `T` | Type alias (request / form / query) | `TCreateOrderData`, `TLoginData` | `contracts/src/features/{feature}/types.ts` |

## Feature folders

Each domain lives under `features/` with enum + schema + types + interfaces:

```txt
contracts/src/
  common/     pagination, message, listQuery base
  features/
    auth/
    user/
    measurement/   enum N/A — schema, types, interface
    customer/
    order/    enum.ts, schema.ts, types.ts, interface.ts
  lib/
```

## Schemas (runtime)

Zod schemas are **not** prefixed with I/E/T:

- `createOrderSchema` / `updateOrderSchema` — write
- `orderSchema` — get / entity (response)
- `orderListQuerySchema` / `paginatedOrdersSchema` — list

They live in `contracts/src/features/{feature}/schema.ts`.

## Shared functions

Pure helpers used by both apps live in `contracts/src/lib/`:

- `field()`, `getFormFields()`
- `formatDate()`, `formatDateTime()`
- `buildPaginationMeta()`, `pageOffset()`, `createPaginatedSchema()`

## Return types

Controllers/services should return **interfaces**:

```ts
create(input: TCreateOrderData): IOrder
login(input: TLoginData): ILoginResponse
list(query: TOrderListQuery): IPaginatedOrders
```

## Form data

Forms bind to **T** aliases inferred from schemas:

```ts
type values = TLoginData; // from loginSchema
```
