import { useState } from "react";
import type { ICustomer } from "@moon-tailors/contracts";
import { ClipboardListIcon, PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { OrdersListModal } from "~/features/orders/list/orders-list-modal";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type OpsStore } from "~/ops";

type CustomerDetailActionsProps = {
  store: OpsStore;
};

/** Their orders — opens in a modal on every screen. */
function CustomerOrdersMenu({
  store,
  customer,
}: {
  store: OpsStore;
  customer: ICustomer;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="size-11 px-0 lg:h-11 lg:w-auto lg:px-5"
        aria-label={t("customers.orderHistory")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <ClipboardListIcon className="size-5" />
        <span className="hidden lg:inline">{t("customers.viewOrders")}</span>
      </Button>
      <OrdersListModal
        store={store}
        open={open}
        onClose={() => setOpen(false)}
        customer={customer}
      />
    </>
  );
}

/** Header actions — view orders + start order. */
export function CustomerDetailActions({ store }: CustomerDetailActionsProps) {
  const { t } = useI18n();
  const getCustomer = useOp(store, "getCustomer");
  const createOrder = useOp(store, "createOrder");
  const customer =
    getCustomer.kind === "query"
      ? (getCustomer.data as ICustomer | undefined)
      : undefined;

  if (createOrder.kind !== "mutation" || !customer) return null;

  return (
    <div className="flex items-center gap-2">
      <CustomerOrdersMenu store={store} customer={customer} />
      {createOrder.allowed ? (
        <Button
          type="button"
          size="lg"
          className="px-3 lg:h-11 lg:px-5"
          aria-label={t("customers.startOrder")}
          onClick={() => createOrder.open(customer)}
        >
          <PlusIcon className="size-5" />
          <span className="lg:hidden">{t("orders.new")}</span>
          <span className="hidden lg:inline">{t("customers.startOrder")}</span>
        </Button>
      ) : null}
    </div>
  );
}
