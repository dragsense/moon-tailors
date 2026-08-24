import { useNavigate, useParams } from "react-router";
import {
  createOrderSchema,
  EOrderStatus,
  type TCreateOrderData,
} from "@moon-tailors/contracts";
import { SchemaForm } from "~/components/form-ui";
import { useI18n } from "~/hooks/use-i18n";
import { Page } from "~/layouts";
import { useOp, type QueryOpComponentProps } from "~/ops";
import { customerPath, orderPath } from "~/config/routes.config";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function CreateOrderView({ store }: QueryOpComponentProps) {
  const { t } = useI18n();
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const createOrder = useOp(store, "createOrder");
  if (createOrder.kind !== "mutation") return null;

  return (
    <Page title={t("orders.new")} description={t("orders.newHint")}>
      <SchemaForm
        schema={createOrderSchema}
        defaultValues={{
          customerId: customerId ?? "",
          orderDate: todayIso(),
          expectedCompletionDate: plusDaysIso(7),
          status: EOrderStatus.NEW,
          totalCost: 0,
          paidAmount: 0,
        }}
        submitLabel={t("orders.create")}
        onSubmit={async (values) => {
          const created = await createOrder.run({
            ...(values as TCreateOrderData),
            customerId: customerId ?? (values as TCreateOrderData).customerId,
          });
          const id = (created as { id?: string } | undefined)?.id;
          navigate(id ? orderPath(id) : customerPath(customerId ?? ""));
        }}
      />
    </Page>
  );
}
