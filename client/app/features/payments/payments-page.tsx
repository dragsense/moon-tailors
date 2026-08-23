import { useEffect, useState } from "react";
import type {
  IPaymentCard,
  IPaymentProcessorCurrent,
  IStripeConnectAccount,
} from "@template/contracts";
import { Alert } from "~/components/layout-ui";
import { Button } from "~/components/ui/button";
import { Page } from "~/layouts";
import { useI18n } from "~/hooks/use-i18n";
import { paymentsService } from "./api";
import { StripeCardModal } from "./stripe/stripe-card-modal";

/** Payments page: current processor + Stripe cards / Connect. */
export function PaymentsPage() {
  const { t } = useI18n();
  const [cards, setCards] = useState<IPaymentCard[]>([]);
  const [connect, setConnect] = useState<IStripeConnectAccount | null>(null);
  const [current, setCurrent] = useState<IPaymentProcessorCurrent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const reload = async () => {
    setError(null);
    try {
      const [cardRes, connectRes, currentRes] = await Promise.all([
        paymentsService.listCards().catch(() => null),
        paymentsService.connectStatus().catch(() => null),
        paymentsService.current().catch(() => null),
      ]);
      if (cardRes) setCards(cardRes.paymentMethods);
      if (connectRes) setConnect(connectRes);
      if (currentRes) setCurrent(currentRes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("payments.loadFailed"),
      );
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  return (
    <Page
      title={t("payments.title")}
      description={t("payments.description")}
      actions={
        <Button type="button" onClick={() => setAddOpen(true)}>
          {t("payments.addCard")}
        </Button>
      }
    >
      {error ? (
        <Alert title={t("payments.title")} tone="danger">
          {error}. {t("payments.stripeHint")}
        </Alert>
      ) : null}

      <section className="space-y-2 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t("payments.current")}</h3>
        {current ? (
          <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            <div>
              <dt className="inline font-medium text-foreground">
                {t("payments.processor")}:{" "}
              </dt>
              <dd className="inline">
                {current.processor.name} ({current.processor.type})
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                {t("payments.source")}:{" "}
              </dt>
              <dd className="inline">{current.source}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-foreground">
                {t("payments.stripeEnabled")}:{" "}
              </dt>
              <dd className="inline">
                {current.stripeEnabled ? t("common.status.success") : "off"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("common.actions.loading")}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{t("payments.envHint")}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium">{t("payments.savedCards")}</h3>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("payments.noCards")}
          </p>
        ) : (
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
              >
                <span>
                  {(card.brand ?? "card").toUpperCase()} ···· {card.last4}
                  {card.isDefault ? ` (${t("payments.default")})` : ""}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void paymentsService.removeCard(card.id).then(reload);
                  }}
                >
                  {t("common.actions.delete")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 pt-4">
        <h3 className="text-sm font-medium">{t("payments.connect")}</h3>
        {connect ? (
          <p className="text-sm text-muted-foreground">
            {t("payments.connectAccount", {
              id: connect.accountId,
              status: connect.chargesEnabled
                ? t("payments.chargesEnabled")
                : t("payments.chargesPending"),
            })}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("payments.notConnected")}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              void paymentsService.connectAccount().then((res) => {
                if (res.onboardingUrl) window.location.href = res.onboardingUrl;
                else void reload();
              });
            }}
          >
            {t("payments.connectContinue")}
          </Button>
          {connect ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void paymentsService.connectLoginLink().then((res) => {
                  window.open(res.url, "_blank");
                });
              }}
            >
              {t("payments.expressDashboard")}
            </Button>
          ) : null}
        </div>
      </section>

      <StripeCardModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => void reload()}
      />
    </Page>
  );
}
