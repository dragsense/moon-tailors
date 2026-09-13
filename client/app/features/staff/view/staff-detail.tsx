import { useState } from "react";
import {
  EStaffStatus,
  type IStaff,
  type TUpdateStaffData,
  updateStaffSchema,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { StaffEmploymentHistory } from "../components/staff-employment-history";
import { StaffStatusBadge } from "../components/staff-status-badge";
import { staffProfileFieldConfig } from "../lib/labels";

export function StaffDetail({
  data,
  isPending,
  isError,
  error,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const updateStaff = useOp(store, "updateStaff");
  const leaveStaff = useOp(store, "leaveStaff");
  const rejoinStaff = useOp(store, "rejoinStaff");
  const changeSalary = useOp(store, "changeStaffSalary");

  if (updateStaff.kind !== "mutation") return null;
  if (leaveStaff.kind !== "mutation") return null;
  if (rejoinStaff.kind !== "mutation") return null;
  if (changeSalary.kind !== "mutation") return null;

  const staff = data as IStaff | undefined;
  const hasLeft = staff?.status === EStaffStatus.LEFT;
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
                <StaffStatusBadge status={staff.status} />
              </div>
              <div className="flex flex-wrap gap-2">
                {hasLeft && rejoinStaff.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => rejoinStaff.open(staff)}
                  >
                    {t("staff.rejoin")}
                  </Button>
                ) : null}
                {!hasLeft &&
                staff.currentEmployment &&
                changeSalary.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => changeSalary.open(staff)}
                  >
                    {t("staff.changeSalary")}
                  </Button>
                ) : null}
                {!hasLeft && leaveStaff.allowed ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => leaveStaff.open(staff)}
                  >
                    {t("staff.markLeft")}
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
                fieldConfig={staffProfileFieldConfig(t)}
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
                <Row label={t("staff.address")} value={staff.address || "—"} />
                {staff.notes ? (
                  <Row label={t("staff.notes")} value={staff.notes} />
                ) : null}
              </dl>
            )}
          </section>

          {/* Left column on wide screens; below the details on phones. */}
          <StaffEmploymentHistory
            employments={staff.employments}
            className="lg:order-first"
          />
        </div>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
