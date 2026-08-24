/** API resources used by route, navigation, and action authorization. */
export enum EResource {
  TASKS = "tasks",
  USERS = "users",
  CHAT = "chat",
  SETTINGS = "settings",
  NOTIFICATIONS = "notifications",
  BUSINESSES = "businesses",
  ACTIVITY_LOGS = "activity_logs",
  SCHEDULES = "schedules",
  USER_AVAILABILITY = "user_availability",
  BILLINGS = "billings",
  PAYMENTS = "payments",
  /** User-managed machine credentials (Bearer / X-Api-Key). */
  API_KEYS = "api_keys",
  /** Uploaded files (local disk or S3). */
  FILES = "files",
  /** Cameras + live MediaMTX streams (HLS / WebRTC). */
  VIDEO_STREAM = "video_stream",
  /** Example overview dashboard (sample stats). */
  DASHBOARD = "dashboard",
  /** AI adapter (completions via business-resolved processor + env keys). */
  AI = "ai",
  /** Twilio SMS inbox (send / receive / threads). */
  SMS = "sms",
  /** SMTP/IMAP email inbox (send / receive / threads). */
  EMAIL = "email",
  CUSTOMERS = "customers",
  MEASUREMENTS = "measurements",
  ORDERS = "orders",
}

export enum EPermissionAction {
  READ = "read",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
}
