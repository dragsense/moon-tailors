import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MediaMtxApiService } from "./mediamtx-api.service";

@Injectable()
export class StreamPathCleanupService {
  private readonly logger = new Logger(StreamPathCleanupService.name);

  constructor(private readonly mediamtxApi: MediaMtxApiService) {}

  /** Remove MediaMTX paths with no viewers and no active source. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupIdlePaths(): Promise<void> {
    let pathNames: string[];
    try {
      pathNames = await this.mediamtxApi.listConfiguredPathNames();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Idle path cleanup skipped: ${msg}`);
      return;
    }

    if (pathNames.length === 0) return;

    let removed = 0;
    for (const pathName of pathNames) {
      try {
        const runtime = await this.mediamtxApi.getPathRuntime(pathName);
        const readerCount = runtime?.readers?.length ?? 0;
        const isIdle = !runtime || (readerCount === 0 && !runtime.ready);
        if (!isIdle) continue;
        await this.mediamtxApi.removePath(pathName);
        removed += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Failed to cleanup idle path ${pathName}: ${msg}`);
      }
    }

    if (removed > 0) {
      this.logger.log(`Removed ${removed} idle MediaMTX path(s)`);
    }
  }
}
