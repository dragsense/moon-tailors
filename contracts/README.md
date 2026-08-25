# Contracts

Shared package used by **backend** and **frontend**.

Not only types — also runtime schemas and shared functions.

## Structure

```txt
src/
  common/       pagination, message response, list-query base
  features/
    auth/       login + session (schema + types + interfaces)
    user/       profile / me / password
    customer/   customers + measurements
    garment-type/ garment catalog (gents / ladies)
    order/      shop orders
    settings/   user preferences
    business/   tenant businesses
    permission/ resources + actions
    dashboard/
    activity-log/
  lib/          field(), format, dates, pagination helpers
```

Each feature folder owns its enums, Zod schemas, request `T*` types, and response `I*` interfaces.

## What belongs here

| Kind | Examples |
|---|---|
| Enums | `EOrderStatus`, `EUserLevel` |
| Create / update schemas | `createOrderSchema`, `updateMeSchema` |
| Entity / get schemas | `orderSchema`, `customerSchema` |
| List query / paginated | `orderListQuerySchema`, `paginatedOrdersSchema` |
| Interfaces (responses) | `IOrder`, `IPaginatedOrders`, `ILoginResponse` |
| Types (requests) | `TCreateOrderData`, `TLoginData` |
| Shared helpers | `buildPaginationMeta`, `getFormFields`, `formatDate` |

## Naming

| Prefix | Use |
|---|---|
| `E` | Enums |
| `I` | Interfaces (entities / responses) |
| `T` | Type aliases (requests / forms / queries) |

Schemas stay camelCase (`createOrderSchema`) — they are runtime validators.

## Feature pattern (order)

```ts
// Write
createOrderSchema → TCreateOrderData
updateOrderSchema → TUpdateOrderData

// Read
orderSchema       → IOrder
orderListQuerySchema → TOrderListQuery
paginatedOrdersSchema → IPaginatedOrders  (flat: data + total/page/limit/…)
```

`meta` matches PaginationMetaDto: `total`, `page`, `limit`, `lastPage`, `hasNextPage`, `hasPrevPage`.

## Form generation

```ts
import { createOrderSchema, getFormFields } from "@moon-tailors/contracts";

const fields = getFormFields(createOrderSchema);
```

## Shared helpers

```ts
import {
  formatDate,
  buildPaginationMeta,
  createPaginatedSchema,
  listQuerySchema,
} from "@moon-tailors/contracts";
```
