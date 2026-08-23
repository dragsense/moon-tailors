import { registerAs } from "@nestjs/config";

export type TwilioConfig = {
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  webhookUrl: string;
  webhookFallbackUrl: string;
};

export default registerAs(
  "twilio",
  (): TwilioConfig => ({
    accountSid: process.env.TWILIO_ACCOUNT_SID || undefined,
    authToken: process.env.TWILIO_AUTH_TOKEN || undefined,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || undefined,
    webhookUrl:
      process.env.TWILIO_SMS_WEBHOOK_URL ||
      "http://localhost:8088/server/api/sms/webhook/twilio",
    webhookFallbackUrl:
      process.env.TWILIO_SMS_WEBHOOK_FALLBACK_URL ||
      "http://localhost:8088/server/api/sms/webhook/twilio/fallback",
  }),
);
