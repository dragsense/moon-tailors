# Frontend

React Router v7 + Vite + Tailwind v4 + [shadcn/ui](https://ui.shadcn.com) + TanStack Query + Zustand.

## Structure

```txt
app/
  hooks/                 # useTheme, useApiQuery, useApiMutation, useConfirm, …
  layouts/               # global shells + page layouts
    global/              # AppShell, AuthShell, FocusShell (+ default route layouts)
    page/                # PageStack (Page), PageSplit, PageTabs
  routes/                # routing only (guards)
    guards/              # GuestGuard, AuthGuard, AccessGuard
  pages/                 # public + protected screens
    public/
    protected/
  ops/                   # createOps, OpsProvider, useOp / useOps
  components/
    ui/                  # shadcn primitives
    layout-ui/           # modal, confirm, list, table, …
    form-ui/               # SchemaForm, FieldControl, …
  features/<name>/
    api.ts               # plain HTTP / BaseService
    ops.ts               # createOps({ id, main, ops })
    form/                # create / edit overlays
    list/                # collection screens
    view/                # detail surfaces
    components/          # shared by form, list, view
```

## Layouts and route guards

Three layout groups in `app/routes.ts`. Guards (middleware-style) wrap shells — middleware-style route guards:

| Group | Guard | Shell | Routes |
|---|---|---|---|
| Auth | `GuestGuard` | `AuthShell` | `/` (login) (`/login` → `/`) |
| App | `AuthGuard` → `AccessGuard` | `AppShell` | `/dashboard`, `/customers`, `/orders`, … |

Marketing landing lives on the **website** package (`http://localhost:8088/`), not here.

The access token stays in memory. The server stores only the rotating refresh token in an HttpOnly cookie. `/auth/me` restores the user after refresh; guards run in `routes/guards/`.

```tsx
import { Page, AppShell } from "~/layouts";
import { useSession, useLogout } from "~/features/auth/hooks";
import { useApiQuery, useConfirm } from "~/hooks";
```

Inner page chrome: `Page` / `PageSplit` / `PageTabs` from `~/layouts/page`.

## Routes and nav as config

URLs and navigation are data, not markup — `app/config/`:

```txt
config/
  routes.config.ts   routes, titles, ROUTE_LEVELS, ROUTE_PERMISSIONS, LEVEL_HOME
  nav.config.ts      grouped NavItems + navItemsByLevel / getNavItems
```

`app/routes.ts` registers paths from these constants, `AppShell` renders the sidebar from `getNavItems(user)`, and `access-guard` denies a page via `canAccessRoute()`. Individual buttons/actions use op-level `permission` + `useOp().allowed`. Broad account categories use `EUserLevel`; fine-grained access comes from server-assigned permissions. The shop has a single **platform owner** seeded from env.

Adding a page:

1. Add the path to `APP_ROUTES` and a label to `ROUTE_TITLES`.
2. Add the screen under `app/pages/public` or `app/pages/protected`.
3. Register it in `app/routes.ts` under the right layout group.
4. Add a `NavItem` (with optional `levels` and permission) in `nav.config.ts`.
5. Add a matching server permission decorator; client checks are UX only.

`NavItem` carries `levels`, permission requirements, and `children`; subscription-feature checks can be added without changing the shell.

## One way: `createOps` store

Arbitrary named **operations** (queries + mutations) in a **Zustand** store. React Query runs under the hood via **`OpsProvider`**. You mount UI yourself (same as the list) — ops only hold data + open/run state.

```ts
// features/tasks/ops.ts
export const tasksOps = createOps({
  id: "tasks",
  scope: "page", // or "global"
  ops: {
    listTasks: {
      kind: "query",
      initialParams: { page: 1, limit: 20 },
      fetch: (params) =>
        apiRequest(`/tasks?page=${params.page}&limit=${params.limit}`),
    },
    createTask: {
      kind: "mutation",
      mutate: (body, params?) =>
        apiRequest("/tasks", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      onSuccess: (result, vars, ops) => {
        void ops.listTasks.refetch();
      },
    },
    markDone: {
      kind: "mutation",
      // optional: gate `run` behind a confirm dialog
      confirm: true, // default title/labels
      // or:
      // confirm: {
      // title: "Mark as done",
      // description: (vars) => `Mark “${vars.title}” as done?`,
      // confirmLabel: "Mark done",
      // tone: "default",
      // component: MyConfirm, // optional custom UI
      // },
      mutate: (vars) => apiRequest(`/tasks/${vars.id}`, { … }),
      onSuccess: (result, vars, ops) => {
        void ops.listTasks.refetch();
      },
    },
  },
});
```

Required per op: `kind` + `fetch` | `mutate`.  
Optional: `initialParams`, `onSuccess`, `onError`, **`confirm`** (mutations only).  
Validation schemas belong on SchemaForm / contracts — not on ops.

### Confirm before action

When a mutation has `confirm` and you call `run()`:

1. `OpsProvider` opens `useConfirm()` dialog (from `~/hooks`)
2. User confirms → `mutate` runs
3. User cancels → promise rejects (`Confirm cancelled`)

```ts
// list button
void deleteTask.run({ id, title }).catch(() => {});
```

No need to mount a mark-done UI for simple confirms — only set form UIs on the op.

### Route — pack UI via OpsProvider

```ts
// features/tasks/ops.ts
export const tasksOps = createOps({
  id: "tasks",
  main: TaskList,
  ops: {
    createTask: {
      kind: "mutation",
      component: CreateTaskForm,
      mutate: …,
    },
    updateStatus: {
      kind: "mutation",
      component: UpdateStatusForm,
      mutate: …,
    },
  },
});
```

```tsx
// routes/tasks.tsx
export default function TasksRoute() {
  return <OpsProvider store={tasksOps} />;
  // main + op components + confirms + RQ
}

// other routes that only need RQ (no list/overlays):
// <OpsProvider store={tasksOps} showMain={false} showComponents={false} />
```

### Components (store only)

```tsx
function TaskList() {
  const list = useOp(tasksOps, "listTasks");
  const createTask = useOp(tasksOps, "createTask");

  return (
    <button type="button" onClick={() => createTask.open()}>
      New task
    </button>
  );
}

function CreateTaskForm() {
  const op = useOp(tasksOps, "createTask");
  if (op.kind !== "mutation" || !op.isOpen) return null;
  // Modal + SchemaForm
}
```

Anywhere:

```ts
tasksOps.getState().ops.createTask.open();
tasksOps.getState().ops.listTasks.setParams({ page: 2 });
```

### Mutation + lifecycle

```ts
mutate: (vars, params?) => Promise<result>
ops.createTask.run(body)
ops.createTask.run(body, extraParams)

onSuccess?: (result, varsOrParams, ops) => void
onError?: (error, varsOrParams, ops) => void
```

- **`onSuccess` always gets `result`**
- **`onError` always gets `error`**
- Third arg `ops` for `refetch` / `open` siblings
- No auto invalidate; no op-level form defaults; no auto-mounted components

### Global pack example

```ts
export const cartOps = createOps({ id: "cart", scope: "global", ops: { … } });

// root layout
<OpsProvider store={cartOps} />

// any deep component
cartOps.getState().ops.addItem.run(item);
```

| Piece | Role |
|---|---|
| `createOps` | Zustand store + op map |
| `OpsProvider` | RQ bridge + optional confirm UI |
| `confirm` on mutation | Gate `run()`; default or custom dialog |
| `useOp` / `useOps` | Selectors |

## Tasks feature shape

```txt
features/tasks/
  ops.ts
  api.ts
  form/         # create / update-status overlays
  list/         # TaskList
  view/         # re-exports shared row (detail views later)
  components/   # shared: TaskRow, …
routes/tasks.tsx
```

## Deploy (`clientMode`)

Vite locally. On a VPS, `clientMode` in `docker/environments.json` chooses who serves `/app/`: **nginx** (gateway files), **nest** (Nest + bind-mount), **ssr** (`react-router-serve` container), **cdn**. See [DEPLOY.md](../docs/DEPLOY.md).
