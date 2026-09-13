import type { TranslationKey } from "~/locales";

type Translate = (key: TranslationKey) => string;

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export { formatAmount } from "~/lib/money";

/** SchemaForm labels for plain vendor info (create + edit). */
export function vendorProfileFieldConfig(t: Translate) {
  return {
    name: {
      label: t("vendors.name"),
      placeholder: t("vendors.namePlaceholder"),
    },
    phone: {
      label: t("vendors.phone"),
      placeholder: t("vendors.phonePlaceholder"),
    },
    company: { label: t("vendors.company") },
    address: { label: t("vendors.address") },
    notes: { label: t("vendors.notes") },
  };
}
