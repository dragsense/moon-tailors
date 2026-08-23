import { useNavigate } from "react-router";
import { APP_ROUTES } from "~/config";
import { BillingFormPage } from "~/features/billing/form/billing-form-page";
import { billingsFormOps } from "~/features/billing/ops/form";
import { OpsProvider } from "~/ops";

export function meta() {
  return [{ title: "New billing · Template" }];
}

export default function NewBillingPage() {
  const navigate = useNavigate();

  return (
    <OpsProvider store={billingsFormOps}>
      {() => (
        <BillingFormPage
          store={billingsFormOps}
          title="New billing"
          description="Create an invoice in three steps."
          onCancel={() => navigate(APP_ROUTES.BILLINGS)}
          onSaved={() => navigate(APP_ROUTES.BILLINGS)}
        />
      )}
    </OpsProvider>
  );
}
