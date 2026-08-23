import type { ConfigModuleOptions } from "@nestjs/config";
import activityLogsConfig from "./activity-logs.config";
import eventsConfig from "./events.config";
import appConfig from "./app.config";
import authConfig from "./auth.config";
import bullBoardConfig from "./bull-board.config";
import bullQueueConfig from "./bull-queue.config";
import cacheConfig from "./cache.config";
import clusterConfig from "./cluster.config";
import databaseConfig from "./database.config";
import encryptionConfig from "./encryption.config";
import mailerConfig from "./mailer.config";
import mqttConfig from "./mqtt.config";
import notificationConfig from "./notification.config";
import platformOwnerConfig from "./platform-owner.config";
import storageConfig from "./storage.config";
import {
  aiProcessorsConfig,
  paymentProcessorsConfig,
} from "./processors.config";
import securitySkipConfig from "./security-skip.config";
import tenantConfig from "./tenant.config";
import mediamtxConfig from "./mediamtx.config";
import twilioConfig from "./twilio.config";
import imapConfig from "./imap.config";
import scalarConfig from "./scalar.config";
import { validateEnvironment } from "./environment.validation";

export const configOptions: ConfigModuleOptions = {
  isGlobal: true,
  cache: true,
  ignoreEnvFile: true,
  validate: validateEnvironment,
  load: [
    appConfig,
    authConfig,
    clusterConfig,
    databaseConfig,
    encryptionConfig,
    securitySkipConfig,
    notificationConfig,
    mailerConfig,
    platformOwnerConfig,
    tenantConfig,
    activityLogsConfig,
    eventsConfig,
    paymentProcessorsConfig,
    aiProcessorsConfig,
    twilioConfig,
    imapConfig,
    mqttConfig,
    bullQueueConfig,
    bullBoardConfig,
    cacheConfig,
    storageConfig,
    mediamtxConfig,
    scalarConfig,
  ],
};
