# Contracts

Shared package used by **backend** and **frontend**.

Not only types — also runtime schemas and shared functions.

## Structure

```txt
src/
  common/       pagination, message response, list-query base
  features/
    auth/       login / signup (schema + types + interfaces)
    user/       create / update / get / list / paginated
    task/       enum + create / update / get / list / paginated
  lib/          field(), format, dates, pagination helpers
```

Each feature folder owns its enums, Zod schemas, request `T*` types, and response `I*` interfaces — same idea as Nest DTO packs (`CreateStaffDto`, `StaffDto`, `StaffListDto`, `StaffPaginatedDto`).

## What belongs here

| Kind | Examples |
|---|---|
| Enums | `ETaskStatus` |
| Create / update schemas | `createTaskSchema`, `updateUserSchema` |
| Entity / get schemas | `taskSchema`, `userSchema` |
| List query / paginated | `taskListQuerySchema`, `paginatedTasksSchema` |
| Interfaces (responses) | `ITask`, `IPaginatedTasks`, `ILoginResponse` |
| Types (requests) | `TCreateTaskData`, `TTaskListQuery` |
| Shared helpers | `buildPaginationMeta`, `getFormFields`, `formatDate` |

## Naming

| Prefix | Use |
|---|---|
| `E` | Enums |
| `I` | Interfaces (entities / responses) |
| `T` | Type aliases (requests / forms / queries) |

Schemas stay camelCase (`createTaskSchema`) — they are runtime validators.

## Feature pattern (task)

```ts
// Write
createTaskSchema → TCreateTaskData
updateTaskSchema → TUpdateTaskData

// Read
taskSchema       → ITask          (+ nested assignee)
taskListQuerySchema → TTaskListQuery
paginatedTasksSchema → IPaginatedTasks  (flat: data + total/page/limit/…)
```

`meta` matches PaginationMetaDto: `total`, `page`, `limit`, `lastPage`, `hasNextPage`, `hasPrevPage`.

## Form generation

```ts
import { createTaskSchema, getFormFields } from "@template/contracts";

const fields = getFormFields(createTaskSchema);
```

## Shared helpers

```ts
import {
  formatDate,
  buildPaginationMeta,
  createPaginatedSchema,
  listQuerySchema,
} from "@template/contracts";
```
