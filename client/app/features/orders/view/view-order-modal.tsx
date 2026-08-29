import type { IOrder } from "@moon-tailors/contracts";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import type { QueryOpComponentProps } from "~/ops";
import { OrderDetail } from "./order-detail";

/** `viewOrder` query modal — data comes from this op’s own `fetch`. */
export function ViewOrderModal({
  isOpen,
  data,
  isPending,
  isError,
  error,
  close,
  store,
}: QueryOpComponentProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const order = data as IOrder | null | undefined;
  const errorMessage =
    isError && error instanceof Error
      ? error.message
      : isError
        ? t("orders.loadFailed")
        : null;

  return (
    <Modal
      title={
        order?.orderNumber ? (
          <>
            <span className="font-bold">{t("orders.numberLabel")}</span>{" "}
            {order.orderNumber}
          </>
        ) : (
          t("orders.profile")
        )
      }
      description={t("orders.detail")}
      onClose={close}
      className="flex h-[min(90vh,52rem)] max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-full flex-col overflow-hidden sm:max-w-5xl"
      contentClassName="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto pr-1"
      error={errorMessage}
    >
      <OrderDetail store={store} order={order} isPending={isPending} />
    </Modal>
  );
}
