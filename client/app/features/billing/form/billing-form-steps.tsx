import type { ReactNode } from "react";
import { useWatch } from "react-hook-form";
import {
 computeBillingAmountCents,
 computeBillingSubtotalCents,
 formatBillingCents,
 type TCreateBilling,
} from "@template/contracts";
import type { SchemaFieldMap } from "~/lib/form";
import { BillingLineItemsFields } from "./billing-line-items";

type BillingFormStepsProps = {
 stepIndex: number;
 fields: SchemaFieldMap;
};

function StepSection({
 title,
 children,
}: {
 title: string;
 children: ReactNode;
}) {
 return (
 <section className="space-y-3">
 <h3 className="text-sm font-semibold text-foreground">{title}</h3>
 {children}
 </section>
);
}

/**
 * Step bodies for create/edit billing. All steps stay mounted (hidden)
 * so react-hook-form values persist — same idea as multi-step forms.
 */
export function BillingFormSteps({ stepIndex, fields }: BillingFormStepsProps) {
 return (
 <div className="min-h-48 space-y-8">
 <div className={stepIndex === 0 ? "block space-y-6" : "hidden"}>
 <StepSection title="Billing information">
 <div className="grid gap-4 sm:grid-cols-2">
 {fields.title}
 {fields.type}
 </div>
 <div className="mt-4">{fields.description}</div>
 <div className="mt-4 grid gap-4 sm:grid-cols-2">
 {fields.issueDate}
 {fields.dueDate}
 </div>
 </StepSection>
 </div>

 <div className={stepIndex === 1 ? "block space-y-6" : "hidden"}>
 <StepSection title="Line items">
 <BillingLineItemsFields />
 </StepSection>
 <StepSection title="Tax">
 <div className="max-w-xs">{fields.taxRate}</div>
 </StepSection>
 <BillingAmountPreview />
 </div>

 <div className={stepIndex === 2 ? "block space-y-6" : "hidden"}>
 <StepSection title="Recipient">
 <div className="max-w-lg">{fields.recipientUserId}</div>
 </StepSection>
 <StepSection title="Notes">
 <div>{fields.notes}</div>
 </StepSection>
 </div>
 </div>
);
}

function BillingAmountPreview() {
 const lineItems = useWatch<TCreateBilling, "lineItems">({ name: "lineItems" });
 const taxRate = useWatch<TCreateBilling, "taxRate">({ name: "taxRate" });
 const items = lineItems ?? [];
 const subtotal = computeBillingSubtotalCents(items);
 const total = computeBillingAmountCents(items, taxRate ?? 0);

 return (
 <div className="rounded-md border border-border px-3 py-2 text-sm">
 <div className="flex justify-between gap-4 text-muted-foreground">
 <span>Subtotal</span>
 <span>{formatBillingCents(subtotal)}</span>
 </div>
 <div className="mt-1 flex justify-between gap-4 font-medium text-foreground">
 <span>Total</span>
 <span>{formatBillingCents(total)}</span>
 </div>
 </div>
);
}
