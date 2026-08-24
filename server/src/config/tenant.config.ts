import { registerAs } from "@nestjs/config";
import { EAppMode, EDbMode } from "@moon-tailors/contracts";

export type TenantConfig = {
  appMode: EAppMode;
  dbMode: EDbMode;
  /** Host labels that are not business subdomains. */
  reservedSubdomains: string[];
};

function parseAppMode(raw?: string): EAppMode {
  const value = (raw ?? EAppMode.SINGLE_USER).toLowerCase();
  if (Object.values(EAppMode).includes(value as EAppMode)) {
    return value as EAppMode;
  }
  return EAppMode.SINGLE_USER;
}

function parseDbMode(raw?: string): EDbMode {
  const value = (raw ?? EDbMode.SINGLE).toLowerCase();
  if (Object.values(EDbMode).includes(value as EDbMode)) {
    return value as EDbMode;
  }
  return EDbMode.SINGLE;
}

export default registerAs(
  "tenant",
  (): TenantConfig => ({
    appMode: parseAppMode(process.env.APP_MODE),
    dbMode: parseDbMode(process.env.DB_MODE),
    reservedSubdomains: (
      process.env.RESERVED_SUBDOMAINS ?? "www,api,app,staging,testing,admin"
    )
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  }),
);
