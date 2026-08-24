import "../load-env";
import { DataSource, DataSourceOptions } from "typeorm";
import { join } from "path";
import { AuditSubscriber } from "../common/entities/audit.subscriber";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url:
    process.env.DATABASE_URL ??
    "postgres://postgres:postgres@localhost:5433/moon_tailors_db",
  entities: [join(__dirname, "../**/*.entity{.ts,.js}")],
  subscribers: [AuditSubscriber],
  migrations: [join(__dirname, "../migrations/*{.ts,.js}")],
  migrationsTableName: "migrations",
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
