import { availableParallelism } from "node:os";
import { registerAs } from "@nestjs/config";

export type ClusterConfig = {
  enabled: boolean;
  workers: number;
};

export function getClusterConfig(): ClusterConfig {
  const available = availableParallelism();
  const requested = Number(process.env.CLUSTER_WORKERS ?? available);
  return {
    enabled: process.env.CLUSTER_ENABLED === "true",
    workers: Math.max(1, Math.min(requested, available)),
  };
}

export default registerAs("cluster", getClusterConfig);
