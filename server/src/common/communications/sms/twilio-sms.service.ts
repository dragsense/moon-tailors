import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import twilio from "twilio";
import type { Twilio } from "twilio";
import type { TwilioConfig } from "../../../config/twilio.config";

export type SmsSendResult = {
 success: boolean;
 error?: string;
 sid?: string;
};

/**
 * Thin Twilio client (shared SMS helper) — send + webhook signature check.
 * Secrets stay in env; no-op when credentials are missing.
 */
@Injectable()
export class TwilioSmsService {
 private readonly logger = new Logger(TwilioSmsService.name);
 private readonly client: Twilio | null;
 private readonly fromNumber: string | undefined;
 private readonly authToken: string | undefined;

 constructor(private readonly config: ConfigService) {
 const twilioCfg = this.config.getOrThrow<TwilioConfig>("twilio");
 this.fromNumber = twilioCfg.phoneNumber;
 this.authToken = twilioCfg.authToken;

 if (twilioCfg.accountSid && twilioCfg.authToken) {
 this.client = twilio(twilioCfg.accountSid, twilioCfg.authToken);
 } else {
 this.client = null;
 this.logger.warn(
 "Twilio credentials not configured; SMS sending is disabled",
);
 }
 }

 isConfigured(): boolean {
 return Boolean(this.client && this.fromNumber);
 }

 getFromNumber(): string | undefined {
 return this.fromNumber;
 }

 async sendSms(to: string, body: string): Promise<SmsSendResult> {
 if (!this.client || !this.fromNumber) {
 return { success: false, error: "SMS not configured (set TWILIO_*)" };
 }

 const normalizedTo = to?.trim();
 if (!normalizedTo) {
 return { success: false, error: "Recipient phone number is missing" };
 }

 const text = (body || "").trim().slice(0, 1600);
 if (!text) {
 return { success: false, error: "Message text is empty" };
 }

 try {
 const message = await this.client.messages.create({
 body: text,
 from: this.fromNumber,
 to: normalizedTo,
 });
 return { success: true, sid: message.sid };
 } catch (error) {
 const errorMessage =
 error instanceof Error ? error.message : "Failed to send SMS";
 this.logger.error(`SMS send failed: ${errorMessage}`);
 return { success: false, error: errorMessage };
 }
 }

 /**
 * Validate Twilio webhook signature. When auth token is missing, reject.
 */
 validateSignature(
 signature: string | undefined,
 url: string,
 params: Record<string, string>,
): boolean {
 if (!this.authToken) return false;
 if (!signature) return false;
 try {
 return twilio.validateRequest(this.authToken, signature, url, params);
 } catch (error) {
 this.logger.warn(
 `Twilio signature validation error: ${error instanceof Error ? error.message : String(error)}`,
);
 return false;
 }
 }
}
