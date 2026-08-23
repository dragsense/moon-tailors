export enum ENotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
  SYSTEM = "system",
}

export enum ENotificationPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}

export enum ENotificationChannel {
  IN_APP = "in_app",
  PUSH = "push",
  EMAIL = "email",
}

/** Mobile FCM device platforms. */
export enum EFcmPlatform {
  ANDROID = "android",
  IOS = "ios",
}
