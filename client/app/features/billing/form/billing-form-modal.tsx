import type { IBilling } from "@template/contracts";
import { Modal } from "~/components/layout-ui";
import type { OpsStore } from "~/ops";
import { BillingForm } from "./billing-form";

export type BillingFormModalProps = {
  open: boolean;
  onClose: () => void;
  store: OpsStore;
  billing?: IBilling | null;
  onSaved?: () => void;
};

/** Modal wrapper around the shared billing form. */
export function BillingFormModal({
  open,
  onClose,
  store,
  billing,
  onSaved,
}: BillingFormModalProps) {
  if (!open) return null;
  const isEdit = Boolean(billing?.id);

  return (
    <Modal
      title={isEdit ? "Edit billing" : "New billing"}
      description="Fill each step, then confirm."
      onClose={onClose}
      className="sm:max-w-3xl"
    >
      <BillingForm
        store={store}
        billing={billing}
        onCancel={onClose}
        onSaved={() => {
          onSaved?.();
          onClose();
        }}
      />
    </Modal>
  );
}
