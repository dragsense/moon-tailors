# Naming conventions

Keep names predictable across contracts, API, and UI.

## Prefixes

| Prefix | Kind | Example | Where |
|---|---|---|---|
| `E` | Enum | `ETaskStatus` | `contracts/src/features/{feature}/enum.ts` |
| `I` | Interface (entity / response) | `ITask`, `ILoginResponse` | `contracts/src/features/{feature}/interface.ts` |
| `T` | Type alias (request / form / query) | `TCreateTaskData`, `TLoginData` | `contracts/src/features/{feature}/types.ts` |

## Feature folders

Each domain lives under `features/` with enum + schema + types + interfaces:

```txt
contracts/src/
  common/     pagination, message, listQuery base
  features/
    auth/
    user/
    task/     enum.ts, schema.ts, types.ts, interface.ts
  lib/
```

## Schemas (runtime)

Zod schemas are **not** prefixed with I/E/T:

- `createTaskSchema` / `updateTaskSchema` — write
- `taskSchema` — get / entity (response)
- `taskListQuerySchema` / `paginatedTasksSchema` — list

They live in `contracts/src/features/{feature}/schema.ts`.

## Shared functions

Pure helpers used by both apps live in `contracts/src/lib/`:

- `field()`, `getFormFields()`
- `formatDate()`, `formatDateTime()`
- `buildPaginationMeta()`, `pageOffset()`, `createPaginatedSchema()`
- `slugify()`, `truncate()`, `toTitleCase()`

## Return types

Controllers/services should return **interfaces**:

```ts
create(input: TCreateTaskData): ITask
login(input: TLoginData): ILoginResponse
list(query: TTaskListQuery): IPaginatedTasks
```

## Form data

Forms bind to **T** aliases inferred from schemas:

```ts
type values = TLoginData; // from loginSchema
```
