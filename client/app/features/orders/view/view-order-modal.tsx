import { useEffect } from "react";
import type { IOrder } from "@moon-tailors/contracts";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { useOp, type MutationOpComponentProps } from "~/ops";
import {
  ORDER_WORKSPACE_MODAL_BODY_CLASS,
  ORDER_WORKSPACE_MODAL_CLASS,
} from "../order-modal";
import { OrderDetailPanel } from "./order-detail-panel";

function orderIdFromPayload(payload: unknown): string | null {
  if (typeof payload === "string" && payload) return payload;
  if (
    payload &&
    typeof payload === "object" &&
    "id" in payload &&
    typeof (payload as { id: unknown }).id === "string"
  ) {
    return (payload as { id: string }).id;
  }
  return null;
}

export function ViewOrderModal({
  isOpen,
  payload,
  close,
  store,
}: MutationOpComponentProps) {
  const { t } = useI18n();
  const orderId = orderIdFromPayload(payload);
  const get = useOp(store, "getOrder");

  useEffect(() => {
    if (
      isOpen &&
      orderId &&
      get.kind === "query" &&
      get.params.id !== orderId
    ) {
      get.setParams({ id: orderId });
    }
  }, [isOpen, orderId, get]);

  if (!isOpen || !orderId) return null;
  if (get.kind !== "query") return null;

  const order = get.data as IOrder | null | undefined;
  const errorMessage =
    get.isError && get.error instanceof Error
      ? get.error.message
      : get.isError
        ? t("orders.loadFailed")
        : null;

  return (
    <Modal
      title={order?.orderNumber ?? t("orders.profile")}
      description={t("orders.detail")}
      onClose={close}
      className={ORDER_WORKSPACE_MODAL_CLASS}
      contentClassName={ORDER_WORKSPACE_MODAL_BODY_CLASS}
      error={errorMessage}
    >
      <OrderDetailPanel
        store={store}
        order={order}
        isPending={get.isPending}
        errorMessage={null}
      />
    </Modal>
  );
}
