import type { IBilling } from "@template/contracts";
import { SurfaceCard } from "~/components/layout-ui";
import { Page } from "~/layouts";
import type { OpsStore } from "~/ops";
import { BillingForm } from "./billing-form";

export type BillingFormPageProps = {
  store: OpsStore;
  billing?: IBilling | null;
  title: string;
  description: string;
  onCancel: () => void;
  onSaved: () => void;
};

/** Full-page billing create/edit shell. */
export function BillingFormPage({
  store,
  billing,
  title,
  description,
  onCancel,
  onSaved,
}: BillingFormPageProps) {
  return (
    <Page title={title} description={description}>
      <SurfaceCard className="mx-auto max-w-3xl" contentClassName="pt-2">
        <BillingForm
          store={store}
          billing={billing}
          onCancel={onCancel}
          onSaved={onSaved}
        />
      </SurfaceCard>
    </Page>
  );
}
