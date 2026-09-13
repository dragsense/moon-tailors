import { EGender, type ICustomer } from "@moon-tailors/contracts";
import { Link } from "react-router";
import { customerPath } from "~/config/routes.config";
import { useI18n } from "~/hooks/use-i18n";
import { cn } from "~/lib/utils";
import { CustomerAvatar } from "../components/customer-avatar";

type CustomerCardProps = {
  customer: ICustomer;
};

type Detail = {
  key: string;
  label: string;
  value?: string;
  /** Spans both columns (long text). */
  wide?: boolean;
  numeric?: boolean;
};

/** Every customer detail, fully visible — nothing truncated. */
export function CustomerCard({ customer }: CustomerCardProps) {
  const { t } = useI18n();
  const genderLabel =
    customer.gender === EGender.FEMALE
      ? t("customers.female")
      : t("customers.male");

  const details: Detail[] = [
    {
      key: "phone",
      label: t("customers.phone"),
      value: customer.phone,
      numeric: true,
    },
    {
      key: "alternative",
      label: t("customers.alternative"),
      value: customer.alternative,
      numeric: true,
    },
    { key: "gender", label: t("customers.gender"), value: genderLabel },
    {
      key: "address",
      label: t("customers.address"),
      value: customer.address,
      wide: true,
    },
    {
      key: "notes",
      label: t("customers.notes"),
      value: customer.notes,
      wide: true,
    },
  ];

  return (
    <Link
      to={customerPath(customer.id)}
      className="group flex h-full min-w-0 flex-col rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border/70 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-primary/40"
    >
      <div className="flex min-w-0 items-center gap-3">
        <CustomerAvatar
          customer={customer}
          size="lg"
          className="hidden size-12 shrink-0 text-base shadow-sm ring-2 ring-background sm:flex"
        />
        <p className="font-heading min-w-0 break-words text-lg font-semibold tracking-tight">
          {customer.name}
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {details
          .filter((detail) => detail.value)
          .map((detail) => (
            <div
              key={detail.key}
              className={cn("min-w-0", detail.wide && "col-span-2")}
            >
              <dt className="text-muted-foreground text-xs font-medium tracking-wide">
                {detail.label}
              </dt>
              <dd
                className={cn(
                  "break-words whitespace-pre-line text-sm font-medium",
                  detail.numeric && "tabular-nums",
                )}
              >
                {detail.value}
              </dd>
            </div>
          ))}
      </dl>
    </Link>
  );
}
