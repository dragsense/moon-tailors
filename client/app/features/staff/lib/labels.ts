import { EStaffPayType, EStaffStatus } from "@moon-tailors/contracts";
import type { TranslationKey } from "~/locales";

type Translate = (key: TranslationKey) => string;

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
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

export function staffStatusLabel(status: EStaffStatus, t: Translate) {
  return status === EStaffStatus.LEFT ? t("staff.left") : t("staff.active");
}

export function staffStatusOptions(t: Translate) {
  return [
    { label: t("staff.active"), value: EStaffStatus.ACTIVE },
    { label: t("staff.left"), value: EStaffStatus.LEFT },
  ];
}

/** SchemaForm labels for plain staff info (create + edit). */
export function staffProfileFieldConfig(t: Translate) {
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
    address: { label: t("staff.address") },
    notes: { label: t("staff.notes") },
  };
}

/** SchemaForm labels for a work period (create + rejoin). */
export function staffPeriodFieldConfig(t: Translate) {
  return {
    joinDate: { label: t("staff.joinDate") },
    payType: {
      label: t("staff.payType"),
      options: staffPayTypeOptions(t),
    },
    salary: { label: t("staff.salary") },
  };
}
