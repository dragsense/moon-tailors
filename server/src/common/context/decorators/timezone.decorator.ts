import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import { RequestContext } from "../request-context";

/**
 * IANA timezone from `X-Timezone` (frontend sends on every API call).
 * Falls back to RequestContext, then UTC.
 *
 * Not auth — lives under `context` because RequestContext already stores timezone.
 */
export const Timezone = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers["x-timezone"];
    const fromHeader = Array.isArray(header) ? header[0] : header;
    return fromHeader || RequestContext.get("timezone") || "UTC";
  },
);
