import { registerAs } from "@nestjs/config";

export type EventsConfig = {
  /**
   * Global kill switch — when false, EventService no-ops and the HTTP
   * interceptor does not emit. Env: EVENTS_ENABLED=true|false.
   */
  enabled: boolean;
};

export default registerAs(
  "events",
  (): EventsConfig => ({
    enabled: process.env.EVENTS_ENABLED === "true",
  }),
);
