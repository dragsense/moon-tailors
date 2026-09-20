import { EStaffPayType } from "@moon-tailors/contracts";
import type { TranslationKey } from "~/locales";

type Translate = (key: TranslationKey) => string;

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

/** Current month as `YYYY-MM`. */
export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function staffPayTypeLabel(payType: EStaffPayType, t: Translate) {
  return payType === EStaffPayType.ON_DEMAND
    ? t("staff.onDemand")
    : t("staff.fixed");
}

export function staffPayTypeOptions(t: Translate) {
  return [
    { label: t("staff.fixed"), value: EStaffPayType.FIXED },
    { label: t("staff.onDemand"), value: EStaffPayType.ON_DEMAND },
  ];
}

/**
 * SchemaForm labels for the whole staff form (create + edit). On-demand staff
 * have no monthly salary — their totals come from each payment instead — so
 * the salary field disappears when that pay type is chosen.
 */
export function staffFieldConfig(t: Translate) {
  return {
    name: {
      label: t("staff.name"),
      placeholder: t("staff.namePlaceholder"),
    },
    phone: {
      label: t("staff.phone"),
      placeholder: t("staff.phonePlaceholder"),
    },
    role: {
      label: t("staff.role"),
      placeholder: t("staff.rolePlaceholder"),
    },
    payType: {
      label: t("staff.payType"),
      options: staffPayTypeOptions(t),
    },
    salary: {
      label: t("staff.salary"),
      hidden: (values: { payType?: EStaffPayType }) =>
        values.payType === EStaffPayType.ON_DEMAND,
    },
    address: { label: t("staff.address") },
    notes: { label: t("staff.notes") },
  };
}
