import { EGender, type ICustomer } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { customerPath } from "~/config/routes.config";
import { useI18n } from "~/hooks/use-i18n";
import { CustomerAvatar } from "../components/customer-avatar";

type CustomerCardProps = {
  customer: ICustomer;
};

export function CustomerCard({ customer }: CustomerCardProps) {
  const { t } = useI18n();
  const genderLabel =
    customer.gender === EGender.FEMALE
      ? t("customers.female")
      : t("customers.male");

  return (
    <Link
      to={customerPath(customer.id)}
      className="group block min-w-0 overflow-hidden rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex items-start gap-4">
        <CustomerAvatar
          customer={customer}
          size="lg"
          className="size-16 text-base shadow-sm ring-2 ring-background"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-medium tracking-wide">
              {t("customers.name")}
            </p>
            <p className="font-heading truncate text-lg font-semibold tracking-tight">
              {customer.name}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide">
                {t("customers.gender")}
              </p>
              <p className="truncate text-sm font-medium">{genderLabel}</p>
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium tracking-wide">
                {t("customers.phone")}
              </p>
              <p className="truncate text-sm font-medium tabular-nums">
                {customer.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
