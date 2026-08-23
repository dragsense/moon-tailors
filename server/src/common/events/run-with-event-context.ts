import { RequestContext } from "../context";
import type { EventPayload } from "./types";

/** Context fields stamped onto every emit by EventService. */
export type EventContextData = {
  tenantId?: string;
  businessId?: string;
  userId?: string;
  subdomain?: string;
  isPlatformBusiness?: boolean;
};

/**
 * Re-enter RequestContext from an event payload (listener pattern).
 * Use in @OnEvent handlers so async work / DB routing sees the same tenant
 * that emitted the event — even after the HTTP ALS frame has ended.
 */
export async function runWithEventContext<T>(
  payload: EventPayload,
  fn: () => T | Promise<T>,
): Promise<T> {
  const data = (payload.data ?? {}) as EventContextData &
    Record<string, unknown>;

  return RequestContext.run(async () => {
    if (typeof data.tenantId === "string" && data.tenantId) {
      RequestContext.set("tenantId", data.tenantId);
    }
    if (typeof data.businessId === "string" && data.businessId) {
      RequestContext.set("businessId", data.businessId);
    }
    if (typeof data.userId === "string" && data.userId) {
      RequestContext.set("userId", data.userId);
    }
    if (typeof data.subdomain === "string" && data.subdomain) {
      RequestContext.set("subdomain", data.subdomain);
    }
    if (typeof data.isPlatformBusiness === "boolean") {
      RequestContext.set("isPlatformBusiness", data.isPlatformBusiness);
    }
    return fn();
  });
}

/** Read tenant/business ids stamped on the payload (no ALS required). */
export function eventContextFromPayload(
  payload: EventPayload,
): EventContextData {
  const data = (payload.data ?? {}) as EventContextData;
  return {
    tenantId: typeof data.tenantId === "string" ? data.tenantId : undefined,
    businessId:
      typeof data.businessId === "string" ? data.businessId : undefined,
    userId: typeof data.userId === "string" ? data.userId : undefined,
    subdomain: typeof data.subdomain === "string" ? data.subdomain : undefined,
    isPlatformBusiness:
      typeof data.isPlatformBusiness === "boolean"
        ? data.isPlatformBusiness
        : undefined,
  };
}
