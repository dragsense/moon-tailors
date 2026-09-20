import { PrinterIcon } from "lucide-react";
import type { IVendorSlip } from "@moon-tailors/contracts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/hooks/use-i18n";
import { formatAmount } from "~/lib/money";
import { cn } from "~/lib/utils";
import { vendorsService } from "../api";

type VendorMonthlySlipProps = {
  month: string;
  onMonthChange: (month: string) => void;
  slip: IVendorSlip | null;
  isPending: boolean;
  error: string | null;
  className?: string;
};

/** Amount colours: money paid out, money still owed, money paid over. */
type Tone = "paid" | "due" | "over";

const toneClass: Record<Tone, string> = {
  paid: "text-emerald-700 dark:text-emerald-400",
  due: "text-amber-700 dark:text-amber-400",
  over: "text-rose-700 dark:text-rose-400",
};

/** Current month as `YYYY-MM`. */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

/**
 * One month with the vendor. `Print` opens the server-rendered statement in a
 * new tab, which carries its own print layout — the app needs none.
 */
export function VendorMonthlySlip({
  month,
  onMonthChange,
  slip,
  isPending,
  error,
  className,
}: VendorMonthlySlipProps) {
  const { t, intlLocale } = useI18n();
  const amount = (value: number) => formatAmount(value, intlLocale);
  const overpaid = (slip?.remaining ?? 0) < 0;

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-border/60 bg-card p-4",
        className,
      )}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("vendors.monthlySlip")}
        </h2>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="vendor-slip-month" className="text-xs">
              {t("vendors.slipMonth")}
            </Label>
            <Input
              id="vendor-slip-month"
              type="month"
              className="h-8 w-40"
              value={month}
              onChange={(event) => onMonthChange(event.target.value)}
            />
          </div>
          <Button type="button" size="sm" variant="outline" asChild={!!slip}>
            {slip ? (
              <a
                href={vendorsService.printUrl(slip.vendor.id, slip.month)}
                target="_blank"
                rel="noreferrer"
              >
                <PrinterIcon className="size-4" />
                {t("vendors.printSlip")}
              </a>
            ) : (
              <span>
                <PrinterIcon className="size-4" />
                {t("vendors.printSlip")}
              </span>
            )}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-destructive text-sm">{error}</p>
      ) : isPending && !slip ? (
        <p className="text-muted-foreground text-sm">
          {t("common.actions.loading")}
        </p>
      ) : !slip ? null : (
        <dl className="space-y-1">
          <Row label={t("vendors.slipPurchases")} value={amount(slip.total)} />
          <Row
            label={t("vendors.slipPaid")}
            value={amount(slip.paid)}
            strong
            tone="paid"
          />
          <Row
            label={
              overpaid ? t("vendors.slipOverpaid") : t("vendors.slipRemaining")
            }
            value={amount(Math.abs(slip.remaining))}
            strong
            tone={overpaid ? "over" : "due"}
          />
        </dl>
      )}
    </section>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: Tone;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border/40 py-1.5 last:border-0">
      <dt
        className={cn("text-muted-foreground text-xs", strong && "font-medium")}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "text-xs tabular-nums",
          strong && "text-sm font-semibold",
          tone && toneClass[tone],
        )}
      >
        {value}
      </dd>
    </div>
  );
}
