import { registerAs } from "@nestjs/config";
import type { ConfigService } from "@nestjs/config";
import { parseRedisUrl } from "./redis.utils";

export type BullQueueConfig = {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
};

export default registerAs(
  "bullQueue",
  (): BullQueueConfig => ({
    redis: parseRedisUrl(process.env.REDIS_URL),
  }),
);

/** Nest BullModule.forRootAsync factory . */
export const getBullQueueConfig = (config: ConfigService) => {
  const redis = config.getOrThrow<BullQueueConfig>("bullQueue").redis;
  return { redis };
};
