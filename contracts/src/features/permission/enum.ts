/** API resources used by route, navigation, and action authorization. */
export enum EResource {
  USERS = "users",
  SETTINGS = "settings",
  BUSINESSES = "businesses",
  ACTIVITY_LOGS = "activity_logs",
  DASHBOARD = "dashboard",
  CUSTOMERS = "customers",
  MEASUREMENTS = "measurements",
  ORDERS = "orders",
  GARMENT_TYPES = "garment_types",
}

export enum EPermissionAction {
  READ = "read",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
}
