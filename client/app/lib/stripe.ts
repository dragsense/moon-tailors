import { loadStripe, type Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null> | null = null;

/** Platform Stripe.js (publishable key from Vite env). */
export function getStripe(): Promise<Stripe | null> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key) return Promise.resolve(null);
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

/** Connected account Stripe.js instance. */
export function getStripeForConnect(
  stripeAccountId: string,
): Promise<Stripe | null> {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  if (!key) return Promise.resolve(null);
  return loadStripe(key, { stripeAccount: stripeAccountId });
}
