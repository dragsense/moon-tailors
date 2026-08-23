import { useCallback, useEffect, useState } from "react";
import {
  formatBillingCents,
  type IBilling,
  type IPaginatedBillings,
} from "@template/contracts";
import { Alert, List, ListPagination } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { userOpsCore } from "~/features/users/ops/core";
import { Page } from "~/layouts";
import { OpsProvider, createOps, pickOps } from "~/ops";
import { billingsService } from "../api";
import { BillingFormModal } from "../form/billing-form-modal";

const billingsPageOps = createOps({
  id: "billings-page",
  scope: "page",
  ops: {
    ...pickOps(userOpsCore, { listUsersDropdown: true }),
  },
});

function BillingListInner({ store }: { store: typeof billingsPageOps }) {
  const [data, setData] = useState<IPaginatedBillings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<IBilling | null>(null);

  const load = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      setData(await billingsService.list({ page, limit: 20 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setPending(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Page
      title="Billings"
      description="Invoices with a stepped create/edit form."
      actions={
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          New billing
        </Button>
      }
    >
      {pending ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : null}
      {error ? (
        <Alert title="Couldn’t load billings" tone="danger">
          {error}
        </Alert>
      ) : null}

      <List
        items={data?.data ?? []}
        getItemKey={(b) => b.id}
        empty={
          !pending && !error ? (
            <p className="text-sm text-muted-foreground">No billings yet.</p>
          ) : null
        }
        renderItem={(billing) => (
          <div className="flex flex-wrap items-center justify-between gap-2 py-2">
            <div>
              <p className="font-medium">{billing.title}</p>
              <p className="text-sm text-muted-foreground">
                {billing.status} ·{" "}
                  {formatBillingCents(billing.amountCents)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(billing);
                setFormOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        )}
      />

      {data ? (
        <ListPagination
          meta={data}
          pageItemCount={data.data.length}
          selectedCount={0}
          isLoading={pending}
          mode="bar"
          onPageChange={setPage}
          onLimitChange={() => undefined}
        />
      ) : null}

      <BillingFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        store={store}
        billing={editing}
        onSaved={() => void load()}
      />
    </Page>
  );
}

export function BillingListPage() {
  return (
    <OpsProvider store={billingsPageOps}>
      {() => <BillingListInner store={billingsPageOps} />}
    </OpsProvider>
  );
}
