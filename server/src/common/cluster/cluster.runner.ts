import cluster from "node:cluster";
import type { ClusterConfig } from "../../config";

type StartWorker = () => Promise<void>;

function logCluster(
  level: "error" | "info" | "warn",
  message: string,
  metadata: Record<string, unknown> = {},
): void {
  const output = `${JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME ?? "template-server",
    context: "Cluster",
    message,
    pid: process.pid,
    ...metadata,
  })}\n`;
  (level === "error" ? process.stderr : process.stdout).write(output);
}

export async function startCluster(
  startWorker: StartWorker,
  config: ClusterConfig,
): Promise<void> {
  if (!config.enabled || !cluster.isPrimary) {
    logCluster("info", config.enabled ? "worker_starting" : "cluster_disabled");
    await startWorker();
    return;
  }

  let shuttingDown = false;
  logCluster("info", "primary_started", { workers: config.workers });

  for (let index = 0; index < config.workers; index += 1) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    logCluster(code === 0 ? "info" : "warn", "worker_exited", {
      workerPid: worker.process.pid,
      code,
      signal,
    });
    if (!shuttingDown) cluster.fork();
  });

  const shutdown = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logCluster("info", "primary_stopping", { signal });

    for (const worker of Object.values(cluster.workers ?? {})) {
      worker?.process.kill(signal);
    }

    const forceTimer = setTimeout(() => {
      logCluster("error", "forced_shutdown");
      process.exit(1);
    }, 10000);
    forceTimer.unref();

    cluster.disconnect(() => {
      clearTimeout(forceTimer);
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}
