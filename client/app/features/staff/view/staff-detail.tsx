import { useEffect, useState } from "react";
import {
  EStaffPayType,
  type IStaff,
  type IStaffSlip,
  type TUpdateStaffData,
  updateStaffSchema,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { cn } from "~/lib/utils";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { StaffMonthlySlip } from "../components/staff-monthly-slip";
import { StaffPaymentHistory } from "../components/staff-payment-history";
import {
  currentMonth,
  staffFieldConfig,
  staffPayTypeLabel,
} from "../lib/labels";

export function StaffDetail({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const [editing, setEditing] = useState(false);
  const [slipMonth, setSlipMonth] = useState(currentMonth);
  const updateStaff = useOp(store, "updateStaff");
  const addPayment = useOp(store, "addStaffPayment");
  const editPayment = useOp(store, "editStaffPayment");
  const slipOp = useOp(store, "getStaffSlip");

  const staff = data as IStaff | undefined;
  const staffId = staff?.id;
  const slipSetParams = slipOp.kind === "query" ? slipOp.setParams : undefined;

  // The slip op is idle until it knows both the staff member and the month.
  useEffect(() => {
    if (!staffId || !slipMonth || !slipSetParams) return;
    slipSetParams({ id: staffId, month: slipMonth });
  }, [staffId, slipMonth, slipSetParams]);

  if (updateStaff.kind !== "mutation") return null;
  if (addPayment.kind !== "mutation") return null;
  if (editPayment.kind !== "mutation") return null;
  if (slipOp.kind !== "query") return null;

  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("staff.loadFailed")
        : null;

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden">
      {isPending && !staff ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : null}
      {errorMessage ? (
        <Alert title={t("staff.loadFailed")} tone="danger">
          {errorMessage}
        </Alert>
      ) : null}

      {staff ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
          <section className="min-w-0 rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <CustomerAvatar
                  customer={staff}
                  size="sm"
                  className="size-10 shrink-0 text-sm"
                />
                <h2 className="font-heading break-words text-base font-semibold">
                  {staff.name}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {addPayment.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => addPayment.open(staff)}
                  >
                    {t("staff.addPayment")}
                  </Button>
                ) : null}
                {updateStaff.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing((value) => !value)}
                  >
                    {editing
                      ? t("common.actions.cancel")
                      : t("common.actions.edit")}
                  </Button>
                ) : null}
              </div>
            </div>
            {editing ? (
              <SchemaForm
                schema={updateStaffSchema}
                defaultValues={staff}
                fieldConfig={staffFieldConfig(t)}
                submitLabel={t("common.actions.save")}
                onSubmit={async (values) => {
                  await updateStaff.run({
                    id: staff.id,
                    ...(values as TUpdateStaffData),
                  });
                  setEditing(false);
                }}
              />
            ) : (
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <Row label={t("staff.phone")} value={staff.phone} />
                <Row label={t("staff.role")} value={staff.role || "—"} />
                <Row
                  label={t("staff.payType")}
                  value={staffPayTypeLabel(staff.payType, t)}
                />
                {/* On-demand staff have no salary — totals live on each payment. */}
                {staff.payType === EStaffPayType.ON_DEMAND ? null : (
                  <Row
                    label={t("staff.salary")}
                    value={formatAmount(staff.salary, intlLocale)}
                  />
                )}
                <Row label={t("staff.address")} value={staff.address || "—"} />
                {staff.notes ? (
                  <Row label={t("staff.notes")} value={staff.notes} />
                ) : null}

                <Row
                  label={t("staff.totalPaid")}
                  value={formatAmount(staff.totalPaid, intlLocale)}
                  tone="paid"
                />
                {/*
                    Only on-demand staff accumulate a lifetime total, from the
                    totals on their payments. A fixed salary has none, because
                    nothing records which months they worked.
                  */}
                {staff.totalRemaining === null ? null : (
                  <Row
                    label={
                      staff.totalRemaining < 0
                        ? t("staff.totalOverpaid")
                        : t("staff.totalRemaining")
                    }
                    value={formatAmount(
                      Math.abs(staff.totalRemaining),
                      intlLocale,
                    )}
                    tone={staff.totalRemaining < 0 ? "over" : "due"}
                  />
                )}
                {staff.totalAmount === null ? null : (
                  <Row
                    label={t("staff.totalAmount")}
                    value={formatAmount(staff.totalAmount, intlLocale)}
                  />
                )}
              </dl>
            )}
          </section>

          <StaffMonthlySlip
            month={slipMonth}
            onMonthChange={setSlipMonth}
            slip={(slipOp.data as IStaffSlip | null) ?? null}
            isPending={slipOp.isPending}
            error={
              slipOp.isError
                ? slipOp.error instanceof Error
                  ? slipOp.error.message
                  : t("staff.loadFailed")
                : null
            }
          />

          <StaffPaymentHistory
            payments={staff.payments ?? []}
            onEdit={
              editPayment.allowed
                ? (payment) => editPayment.open({ staff, payment })
                : undefined
            }
            className="lg:col-span-2"
          />
        </div>
      ) : null}
    </div>
  );
}

/** Money colours: paid out, still owed, paid beyond the total. */
const toneClass = {
  paid: "font-semibold text-emerald-700 dark:text-emerald-400",
  due: "font-semibold text-amber-700 dark:text-amber-400",
  over: "font-semibold text-rose-700 dark:text-rose-400",
};

function Row({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: keyof typeof toneClass;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className={cn("tabular-nums", tone && toneClass[tone])}>{value}</dd>
    </div>
  );
}
