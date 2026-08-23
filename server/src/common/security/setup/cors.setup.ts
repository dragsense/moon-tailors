import type { INestApplication } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../config";

/** Expand localhost ↔ 127.0.0.1 so Vite / gateway origins both match. */
function expandOrigins(origins: string[]): Set<string> {
  const allowed = new Set<string>();
  for (const origin of origins) {
    const trimmed = origin.trim();
    if (!trimmed) continue;
    allowed.add(trimmed);
    try {
      const url = new URL(trimmed);
      if (url.hostname === "localhost") {
        url.hostname = "127.0.0.1";
        allowed.add(url.origin);
      } else if (url.hostname === "127.0.0.1") {
        url.hostname = "localhost";
        allowed.add(url.origin);
      }
    } catch {
      /* keep raw string */
    }
  }
  return allowed;
}

/** Browser CORS from APP / CORS_ORIGIN config. */
export function setupCors(
  app: INestApplication,
  configService: ConfigService,
): void {
  const origins = configService.get<AppConfig>("app")?.corsOrigins ?? [];
  const allowed = expandOrigins(origins);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Non-browser / same-origin proxies send no Origin
      if (!origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "X-Request-Id",
      "X-Timezone",
      "X-CSRF-Token",
      "X-Sender",
      "X-Api-Key",
      "X-Tenant-Id",
    ],
    exposedHeaders: ["Content-Disposition", "X-Request-Id"],
    maxAge: 3600,
  });
}
