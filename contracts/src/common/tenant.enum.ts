/** How the request resolves a business/tenant hint. */
export enum EAppMode {
  /** No multi-tenancy — always main DB. */
  SINGLE_USER = "single_user",
  /** One domain; tenant via header/query/cookie (`x-tenant-id`). */
  SINGLE_DOMAIN_TENANT = "single_domain_tenant",
}

/** How tenant data is isolated. */
export enum EDbMode {
  /** Shared tables; optional tenantId column later. */
  SINGLE = "single",
  /** Separate Postgres database per tenant. */
  MULTI_DATABASE = "multi-database",
}
