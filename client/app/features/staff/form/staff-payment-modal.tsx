import {
  createStaffPaymentSchema,
  EStaffPayType,
  type IStaff,
  type IStaffPayment,
  type TCreateStaffPaymentData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import type { MutationOpComponentProps } from "~/ops";
import { staffPayTypeLabel, todayIsoDate } from "../lib/labels";

/** Adding opens with the staff member; editing adds the payment to correct. */
export type StaffPaymentPayload = IStaff | { staff: IStaff; payment: IStaffPayment };

/**
 * Records or corrects money handed over. The amount is never capped, and the
 * total is only asked for when the staff member is paid on demand — fixed
 * staff take their monthly total from their salary.
 */
export function StaffPaymentModal({
  isOpen,
  isError,
  error,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const data = payload as StaffPaymentPayload | null;
  if (!isOpen || !data) return null;

  const editing = "staff" in data;
  const staff = editing ? data.staff : data;
  const payment = editing ? data.payment : null;
  const isFixed = staff.payType !== EStaffPayType.ON_DEMAND;

  return (
    <Modal
      title={editing ? t("staff.editPayment") : t("staff.addPayment")}
      description={t("staff.addPaymentHint", { name: staff.name })}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-md"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("staff.loadFailed")
          : null
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs">
            {staffPayTypeLabel(staff.payType, t)}
          </p>
          {/* On-demand staff have no salary — the total is typed below. */}
          {isFixed ? (
            <p className="font-medium tabular-nums">
              {formatAmount(staff.salary, intlLocale)}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs tabular-nums">
            {t("staff.totalPaid")}: {formatAmount(staff.totalPaid, intlLocale)}
          </p>
        </div>

        <SchemaForm
          schema={createStaffPaymentSchema}
          defaultValues={
            payment
              ? {
                  paymentDate: payment.paymentDate,
                  totalAmount: payment.totalAmount ?? undefined,
                  amount: payment.amount,
                  notes: payment.notes ?? "",
                }
              : { paymentDate: todayIsoDate() }
          }
          fieldConfig={{
            paymentDate: { label: t("staff.paymentDate") },
            totalAmount: { label: t("staff.totalAmount"), hidden: isFixed },
            amount: { label: t("staff.paidAmount") },
            notes: { label: t("staff.notes") },
          }}
          submitLabel={t("staff.savePayment")}
          onSubmit={async (values) => {
            try {
              await submit({
                id: staff.id,
                paymentId: payment?.id,
                ...(values as TCreateStaffPaymentData),
                // Shown in the "right person?" confirm box; stripped before the API call.
                staffName: staff.name,
                staffPhone: staff.phone,
                staffRole: staff.role,
              });
            } catch (err) {
              // Cancelled in the confirm box — keep the form open, no error.
              if (err instanceof Error && err.message === "Confirm cancelled") return;
              throw err;
            }
            close();
          }}
        />
      </div>
    </Modal>
  );
}
