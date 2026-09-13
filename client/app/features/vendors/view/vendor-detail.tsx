import { useState } from "react";
import {
  type IVendor,
  type TUpdateVendorData,
  updateVendorSchema,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { VendorPaymentHistory } from "../components/vendor-payment-history";
import { VendorPurchaseHistory } from "../components/vendor-purchase-history";
import { VendorPaymentBadge } from "../components/vendor-payment-badge";
import { VendorTotals } from "../components/vendor-totals";
import { vendorProfileFieldConfig } from "../lib/format";

export function VendorDetail({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const updateVendor = useOp(store, "updateVendor");
  const addPurchase = useOp(store, "addVendorPurchase");
  const addPayment = useOp(store, "addVendorPayment");

  if (updateVendor.kind !== "mutation") return null;
  if (addPurchase.kind !== "mutation") return null;
  if (addPayment.kind !== "mutation") return null;

  const vendor = data as IVendor | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("vendors.loadFailed")
        : null;

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      {isPending && !vendor ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("vendors.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {vendor ? (
        <>
          <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
            <section className="min-w-0 rounded-xl border border-border/60 bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <CustomerAvatar
                    customer={vendor}
                    size="sm"
                    className="size-10 shrink-0 text-sm"
                  />
                  <h2 className="font-heading break-words text-base font-semibold">
                    {vendor.name}
                  </h2>
                </div>
                {updateVendor.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing
                      ? t("common.actions.cancel")
                      : t("common.actions.edit")}
                  </Button>
                ) : null}
              </div>
              {editing ? (
                <SchemaForm
                  schema={updateVendorSchema}
                  defaultValues={vendor}
                  fieldConfig={vendorProfileFieldConfig(t)}
                  submitLabel={t("common.actions.save")}
                  onSubmit={async (values) => {
                    await updateVendor.run({
                      id: vendor.id,
                      ...(values as TUpdateVendorData),
                    });
                    setEditing(false);
                  }}
                />
              ) : (
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <Row label={t("vendors.phone")} value={vendor.phone} />
                  <Row
                    label={t("vendors.company")}
                    value={vendor.company || "—"}
                  />
                  <Row
                    label={t("vendors.address")}
                    value={vendor.address || "—"}
                  />
                  {vendor.notes ? (
                    <Row label={t("vendors.notes")} value={vendor.notes} />
                  ) : null}
                </dl>
              )}
            </section>

            <section className="min-w-0 rounded-xl border border-border/60 bg-card p-4">
              {/* Phones: heading row, then full-width buttons. Wider: one row. */}
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <h2 className="font-heading text-base font-semibold">
                    {t("vendors.balance")}
                  </h2>
                  <VendorPaymentBadge totals={vendor.totals} />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {addPurchase.allowed ? (
                    <Button
                      type="button"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => addPurchase.open(vendor)}
                    >
                      {t("vendors.addPurchase")}
                    </Button>
                  ) : null}
                  {addPayment.allowed ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      disabled={vendor.totals.remaining <= 0}
                      onClick={() => addPayment.open(vendor)}
                    >
                      {t("vendors.addPayment")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <VendorTotals totals={vendor.totals} />
            </section>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
            <VendorPurchaseHistory purchases={vendor.purchases ?? []} />
            <VendorPaymentHistory payments={vendor.payments ?? []} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
