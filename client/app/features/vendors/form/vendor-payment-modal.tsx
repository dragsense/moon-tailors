import {
  createVendorPaymentSchema,
  type IVendor,
  type TCreateVendorPaymentData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { MutationOpComponentProps } from "~/ops";
import { VendorTotals } from "../components/vendor-totals";
import { todayIsoDate } from "../lib/format";

/** Payment against the vendor’s balance. Shows total / paid / remaining first. */
export function VendorPaymentModal({
  isOpen,
  isError,
  error,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const vendor = payload as IVendor | null;
  if (!isOpen || !vendor) return null;

  return (
    <Modal
      title={t("vendors.addPayment")}
      description={t("vendors.addPaymentHint", { name: vendor.name })}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-md"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("vendors.loadFailed")
          : null
      }
    >
      <div className="space-y-4">
        <VendorTotals totals={vendor.totals} size="sm" />
        <SchemaForm
          schema={createVendorPaymentSchema}
          defaultValues={{
            paymentDate: todayIsoDate(),
            amount: vendor.totals.remaining > 0 ? vendor.totals.remaining : undefined,
          }}
          fieldConfig={{
            paymentDate: { label: t("vendors.paymentDate") },
            amount: { label: t("vendors.amount") },
            notes: { label: t("vendors.notes") },
          }}
          submitLabel={t("vendors.savePayment")}
          onSubmit={async (values) => {
            try {
              await submit({
                id: vendor.id,
                ...(values as TCreateVendorPaymentData),
                // Shown in the "right vendor?" confirm box; stripped before the API call.
                vendorName: vendor.name,
                vendorCompany: vendor.company,
                vendorPhone: vendor.phone,
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
