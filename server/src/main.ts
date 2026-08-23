import "./load-env";

import { startApplication } from "./app";
import { handleStartupError } from "./common/app-setup";
import { startCluster } from "./common/cluster";
import {
  getClusterConfig,
  validateEnvironment,
} from "./config";

validateEnvironment(process.env);
void startCluster(startApplication, getClusterConfig()).catch(
  handleStartupError,
);
