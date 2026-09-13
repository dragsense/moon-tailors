import type { IVendor } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { vendorPath } from "~/config/routes.config";
import { CustomerAvatar } from "~/features/customers/components/customer-avatar";
import { useI18n } from "~/hooks/use-i18n";
import { VendorPaymentBadge } from "../components/vendor-payment-badge";
import { VendorTotals } from "../components/vendor-totals";

type VendorCardProps = {
  vendor: IVendor;
};

export function VendorCard({ vendor }: VendorCardProps) {
  const { t } = useI18n();

  return (
    <Link
      to={vendorPath(vendor.id)}
      className="group block min-w-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <CustomerAvatar
          customer={vendor}
          size="lg"
          className="hidden size-16 text-base shadow-sm ring-2 ring-background sm:flex"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="min-w-0">
            <p className="text-muted-foreground truncate text-xs font-medium tracking-wide">
              {vendor.company || t("vendors.name")}
            </p>
            <p className="font-heading break-words text-lg font-semibold tracking-tight">
              {vendor.name}
            </p>
            <p className="truncate text-sm font-medium tabular-nums">
              {vendor.phone}
            </p>
          </div>
          <VendorPaymentBadge totals={vendor.totals} />
          <VendorTotals totals={vendor.totals} size="sm" />
        </div>
      </div>
    </Link>
  );
}
