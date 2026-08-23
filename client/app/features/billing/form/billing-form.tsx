import type { IBilling, TCreateBilling } from "@template/contracts";
import { createBillingSchema, updateBillingSchema } from "@template/contracts";
import {
  SchemaSteps,
  SchemaStepsNav,
  type FormStep,
} from "~/components/form-ui";
import { OpsComponent, type OpsStore } from "~/ops";
import { FieldShell } from "~/lib/form";
import { billingsService } from "../api";
import { BillingFormSteps } from "./billing-form-steps";

export const BILLING_FORM_STEPS: FormStep[] = [
  {
    id: "details",
    label: "Details",
    description: "Title, type, dates",
    fields: ["title", "type", "description", "issueDate", "dueDate"],
  },
  {
    id: "items",
    label: "Line items",
    description: "Amounts and tax",
    fields: ["lineItems", "taxRate"],
  },
  {
    id: "recipient",
    label: "Recipient",
    description: "Who pays",
    fields: ["recipientUserId", "notes"],
  },
];

export type BillingFormProps = {
  store: OpsStore;
  billing?: IBilling | null;
  onCancel: () => void;
  onSaved: () => void;
};

export function defaultBillingFormValues(
  billing?: IBilling | null,
): Partial<TCreateBilling> {
  if (billing) {
    return {
      title: billing.title,
      type: billing.type,
      description: billing.description,
      issueDate: billing.issueDate,
      dueDate: billing.dueDate,
      lineItems: billing.lineItems,
      taxRate: billing.taxRate,
      recipientUserId: billing.recipientUserId,
      notes: billing.notes,
    };
  }
  return {
    lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
  };
}

/** Shared 3-step billing create/edit form (page or modal). */
export function BillingForm({ store, billing, onCancel, onSaved }: BillingFormProps) {
  const isEdit = Boolean(billing?.id);

  return (
    <SchemaSteps
      schema={isEdit ? updateBillingSchema : createBillingSchema}
      steps={BILLING_FORM_STEPS}
      defaultValues={defaultBillingFormValues(billing)}
      fieldConfig={{
        recipientUserId: {
          render: ({ field, error, disabled, meta }) => (
            <FieldShell
              name={String(field.name)}
              label={meta.label}
              error={error}
            >
              <OpsComponent
                store={store}
                name="listUsersDropdown"
                field={{
                  name: String(field.name),
                  value: field.value,
                  onChange: field.onChange,
                  onBlur: field.onBlur,
                  disabled,
                  error,
                }}
              />
            </FieldShell>
          ),
        },
      }}
      onSubmit={async (values) => {
        const payload = values as TCreateBilling;
        if (isEdit) {
          await billingsService.update(billing!.id, payload);
        } else {
          await billingsService.create(payload);
        }
        onSaved();
      }}
    >
      {({
        stepIndex,
        fields,
        isFirst,
        isLast,
        isSubmitting,
        goNext,
        goPrev,
      }) => (
        <div className="space-y-6">
          <BillingFormSteps stepIndex={stepIndex} fields={fields} />
          <SchemaStepsNav
            isFirst={isFirst}
            isLast={isLast}
            isSubmitting={isSubmitting}
            onPrev={goPrev}
            onNext={() => void goNext()}
            onCancel={onCancel}
            submitLabel={isEdit ? "Save billing" : "Create billing"}
          />
        </div>
      )}
    </SchemaSteps>
  );
}
