import { registerAs } from "@nestjs/config";

export type DatabaseConfig = {
  url: string;
  synchronize: boolean;
};

export default registerAs(
  "database",
  (): DatabaseConfig => ({
    url:
      process.env.DATABASE_URL ??
      "postgres://postgres:postgres@localhost:5433/moon_tailors_db",
    synchronize:
      process.env.TYPEORM_SYNC === "true" ||
      process.env.NODE_ENV !== "production",
  }),
);
