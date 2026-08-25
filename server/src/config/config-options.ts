import type { ConfigModuleOptions } from "@nestjs/config";
import activityLogsConfig from "./activity-logs.config";
import eventsConfig from "./events.config";
import appConfig from "./app.config";
import authConfig from "./auth.config";
import cacheConfig from "./cache.config";
import clusterConfig from "./cluster.config";
import databaseConfig from "./database.config";
import platformOwnerConfig from "./platform-owner.config";

import securitySkipConfig from "./security-skip.config";
import tenantConfig from "./tenant.config";
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
    securitySkipConfig,
    platformOwnerConfig,
    tenantConfig,
    activityLogsConfig,
    eventsConfig,
    cacheConfig,
    scalarConfig,
  ],
};
