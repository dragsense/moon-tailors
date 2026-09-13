/** How a staff member is paid. */
export enum EStaffPayType {
  /** Fixed monthly salary. */
  FIXED = "fixed",
  /** Paid per job / on demand. */
  ON_DEMAND = "on_demand",
}

/** Whether the staff member currently works in the shop. */
export enum EStaffStatus {
  ACTIVE = "active",
  LEFT = "left",
}
