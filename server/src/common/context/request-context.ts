import { AsyncLocalStorage } from "node:async_hooks";
import type { EUserLevel } from "@template/contracts";

export type RequestContextValues = {
  requestId: string;
  timezone: string | undefined;
  userId: string;
  userLevel: EUserLevel;
  /** Business row id (main DB registry). */
  businessId: string | undefined;
  /** Isolation key — DB name / schema routing. */
  tenantId: string | undefined;
  /**
   * Platform / default business — always uses main DB (never a tenant database)
   * and processor config from env (`DEFAULT_*`).
   */
  isPlatformBusiness: boolean | undefined;
  /** From hostname when APP_MODE=multi_domain_tenant. */
  subdomain: string | undefined;
};

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<
    Map<keyof RequestContextValues, unknown>
  >();

  static run<T>(callback: () => T): T {
    return this.storage.run(new Map(), callback);
  }

  static get<K extends keyof RequestContextValues>(
    key: K,
  ): RequestContextValues[K] | undefined {
    return this.storage.getStore()?.get(key) as
      | RequestContextValues[K]
      | undefined;
  }

  static set<K extends keyof RequestContextValues>(
    key: K,
    value: RequestContextValues[K],
  ): void {
    this.storage.getStore()?.set(key, value);
  }
}
