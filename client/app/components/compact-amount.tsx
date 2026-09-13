import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useI18n } from "~/hooks/use-i18n";
import { DEFAULT_CURRENCY, formatCompactAmount } from "~/lib/money";
import { cn } from "~/lib/utils";

type CompactAmountProps = {
  value: number;
  /** Defaults to PKR; pass `null` for plain numbers. */
  currency?: string | null;
  /** Shown above the exact amount in the tooltip, e.g. "Paid to vendors". */
  label?: string;
  className?: string;
};

/**
 * Big amounts shortened ("PKR 1.13M") with a styled tooltip showing the exact value.
 * Small amounts render as plain text — no tooltip needed.
 */
export function CompactAmount({
  value,
  currency = DEFAULT_CURRENCY,
  label,
  className,
}: CompactAmountProps) {
  const { intlLocale } = useI18n();
  const amount = formatCompactAmount(value, intlLocale, currency);

  if (!amount.isCompact) {
    return <span className={cn("tabular-nums", className)}>{amount.text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={label ? `${label}: ${amount.full}` : amount.full}
          className={cn(
            "cursor-help rounded-sm tabular-nums underline decoration-current/40 decoration-dotted underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {amount.text}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={6}
        className="flex-col items-start gap-0.5 px-3 py-2"
      >
        {label ? (
          <span className="text-[11px] font-medium text-background/70">
            {label}
          </span>
        ) : null}
        <span className="text-sm font-semibold tabular-nums">{amount.full}</span>
      </TooltipContent>
    </Tooltip>
  );
}
