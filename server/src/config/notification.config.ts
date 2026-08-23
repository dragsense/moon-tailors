import { registerAs } from "@nestjs/config";

export type NotificationConfig = {
  push: {
    vapidPublicKey?: string;
    vapidPrivateKey?: string;
    vapidEmail: string;
  };
  firebase: {
    projectId?: string;
    clientEmail?: string;
    privateKey?: string;
  };
};

export default registerAs(
  "notifications",
  (): NotificationConfig => ({
    push: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
      vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
      vapidEmail: process.env.VAPID_EMAIL ?? "mailto:admin@example.com",
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    },
  }),
);
