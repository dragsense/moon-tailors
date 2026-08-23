import { useState } from "react";
import {
  CardElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Button } from "~/components/ui/button";
import { getStripe } from "~/lib/stripe";
import { paymentsService } from "../api";

export type StripeCardModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  setAsDefault?: boolean;
};

function AddCardForm({
  onOpenChange,
  onSaved,
  setAsDefault = true,
}: Omit<StripeCardModalProps, "open">) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError(null);
    try {
      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Card element missing");
      const { error: createError, paymentMethod } =
        await stripe.createPaymentMethod({ type: "card", card });
      if (createError || !paymentMethod) {
        throw new Error(createError?.message ?? "Could not create card");
      }
      await paymentsService.addCard({
        paymentMethodId: paymentMethod.id,
        setAsDefault,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border p-3">
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#111" },
            },
          }}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="button" disabled={busy || !stripe} onClick={() => void submit()}>
          {busy ? "Saving…" : "Add card"}
        </Button>
      </div>
    </div>
  );
}

/** Stripe Elements card modal — FE payment adapter piece. */
export function StripeCardModal(props: StripeCardModalProps) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-background p-6 shadow-lg space-y-3">
        <h2 className="text-lg font-semibold">Add card</h2>
        <Elements stripe={getStripe()}>
          <AddCardForm {...props} />
        </Elements>
      </div>
    </div>
  );
}
