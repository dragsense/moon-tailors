import type { ICustomer } from "@moon-tailors/contracts";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { OpsComponent, type OpsStore } from "~/ops";

type OrdersListModalProps = {
  store: OpsStore;
  open: boolean;
  onClose: () => void;
  /** When set, this is that customer’s orders — show their name and phone. */
  customer?: Pick<ICustomer, "name" | "phone"> | null;
};

const modalClassName =
  "flex h-[min(90vh,52rem)] max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-full flex-col overflow-hidden sm:max-w-5xl";

function customerLine(customer: Pick<ICustomer, "name" | "phone">) {
  return [customer.name, customer.phone].filter(Boolean).join(" · ");
}

/** Full order list in the same size modal as create/view order. */
export function OrdersListModal({
  store,
  open,
  onClose,
  customer,
}: OrdersListModalProps) {
  const { t } = useI18n();
  if (!open) return null;

  const scoped = Boolean(customer);

  return (
    <Modal
      title={scoped ? t("customers.orderHistory") : t("orders.title")}
      description={
        customer ? customerLine(customer) : t("orders.description")
      }
      onClose={onClose}
      className={modalClassName}
      contentClassName="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <OpsComponent store={store} name="listOrders" />
    </Modal>
  );
}
