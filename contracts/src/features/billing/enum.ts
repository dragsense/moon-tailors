export enum EBillingType {
  SESSION = "session",
  MONTHLY = "monthly",
  PACKAGE = "package",
  PRODUCT = "product",
}

export enum EBillingStatus {
  DRAFT = "draft",
  PENDING = "pending",
  PAID = "paid",
  PARTIALLY_PAID = "partially_paid",
  FAILED = "failed",
  CANCELLED = "cancelled",
}
