import {
  type IOrder,
  receiveOrderPaymentSchema,
  type TReceiveOrderPaymentData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { Modal } from "~/components/layout-ui";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import type { MutationOpComponentProps } from "~/ops";
import { dueMoneyClass, paidMoneyClass } from "../status-style";

/** Money received from the customer for one order. Payload: the order. */
export function ReceivePaymentModal({
  isOpen,
  isError,
  error,
  payload,
  close,
  submit,
}: MutationOpComponentProps) {
  const { t, intlLocale } = useI18n();
  const order = payload as IOrder | null;
  if (!isOpen || !order) return null;

  const rows = [
    {
      key: "total",
      label: t("orders.totalCost"),
      value: order.totalCost,
      className: "tabular-nums",
    },
    {
      key: "paid",
      label: t("orders.paidAmount"),
      value: order.paidAmount,
      className: paidMoneyClass,
    },
    {
      key: "remaining",
      label: t("orders.remainingAmount"),
      value: order.remainingAmount,
      className: dueMoneyClass(order.remainingAmount),
    },
  ];

  return (
    <Modal
      title={t("orders.receivePayment")}
      description={t("orders.receivePaymentHint", {
        number: order.orderNumber,
        name: order.customer?.name ?? "",
      })}
      onClose={close}
      className="max-h-[90vh] overflow-y-auto sm:max-w-md"
      error={
        isError
          ? error instanceof Error
            ? error.message
            : t("orders.loadFailed")
          : null
      }
    >
      <div className="space-y-4">
        <dl className="grid gap-1.5 rounded-lg border border-border/50 px-3 py-2 text-sm">
          {rows.map((row) => (
            <div key={row.key} className="flex items-baseline justify-between gap-3">
              <dt className="text-muted-foreground text-xs">{row.label}</dt>
              <dd className={row.className}>{formatAmount(row.value, intlLocale)}</dd>
            </div>
          ))}
        </dl>
        <SchemaForm
          schema={receiveOrderPaymentSchema}
          defaultValues={{ amount: order.remainingAmount }}
          fieldConfig={{ amount: { label: t("orders.paymentAmount") } }}
          submitLabel={t("orders.savePayment")}
          onSubmit={async (values) => {
            await submit({
              id: order.id,
              ...(values as TReceiveOrderPaymentData),
            });
            close();
          }}
        />
      </div>
    </Modal>
  );
}
