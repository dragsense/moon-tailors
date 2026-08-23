import type { IPaginatedResponse } from "@template/contracts";
import { Alert, CardRow, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { useI18n } from "~/hooks/use-i18n";
import {
  formatDateTimeWithSettings,
  settingsOps,
} from "~/features/settings";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { userDisplayName, type TUserRow } from "../api";

/**
 * Users page list — page chrome via `Page`; CRUD + task ops from store.
 */
export function UserList({
  data,
  isPending,
  isError,
  error,
  store,
  params,
  setParams,
}: QueryOpComponentProps) {
  const { intlLocale } = useI18n();
  const mySettings = useOp(settingsOps, "mySettings");
  const prefsData = mySettings.kind === "query" ? mySettings.data : undefined;
  const createUser = useOp(store, "createUser");
  const deleteUser = useOp(store, "deleteUser");
  const createTask = useOp(store, "createTask");

  if (createUser.kind !== "mutation") return null;
  if (deleteUser.kind !== "mutation") return null;
  if (createTask.kind !== "mutation") return null;

  const page = data as IPaginatedResponse<TUserRow> | undefined;
  const users = page?.data ?? [];
  const meta = page;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? "Failed to load users"
        : null;

  return (
    <Page
      title="Users"
      description="Example feature pack with task create from taskOpsCore — no tasksListOps on this page."
      actions={
        <>
          {createTask.allowed ? (
            <Button type="button" variant="outline" onClick={() => createTask.open()}>
              New task
            </Button>
          ) : null}
          {createUser.allowed ? (
            <Button type="button" onClick={() => createUser.open()}>
              New user
            </Button>
          ) : null}
        </>
      }
    >
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : null}

      {errorMessage ? (
        <Alert title="Couldn’t load users" tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      <List
        items={users}
        getItemKey={(u: TUserRow) => u.id}
        empty={
          !isPending && !errorMessage ? (
            <p className="text-sm text-muted-foreground">No users yet.</p>
          ) : null
        }
        renderItem={(user: TUserRow) => (
          <CardRow
            title={userDisplayName(user)}
            actions={
              <>
                {createTask.allowed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => createTask.open()}
                  >
                    New task
                  </Button>
                ) : null}
                {deleteUser.allowed ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void deleteUser
                        .run({ id: user.id, name: userDisplayName(user) })
                        .catch(() => {});
                    }}
                  >
                    Delete
                  </Button>
                ) : null}
              </>
            }
          >
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTimeWithSettings(user.createdAt, prefsData, intlLocale)}
            </p>
          </CardRow>
        )}
      />

      {meta ? (
        <ListPagination
          meta={meta}
          pageItemCount={users.length}
          isLoading={isPending}
          mode="bar"
          onPageChange={(pageNumber) => setParams({ ...params, page: pageNumber })}
          onLimitChange={(limit) => setParams({ ...params, page: 1, limit })}
        />
      ) : null}
    </Page>
  );
}

