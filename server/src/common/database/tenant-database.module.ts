import { Global, Module } from "@nestjs/common";
import {
  DatabaseManager,
  EntityRouterService,
  EntityService,
} from "./services";

@Global()
@Module({
  providers: [DatabaseManager, EntityRouterService, EntityService],
  exports: [DatabaseManager, EntityRouterService, EntityService],
})
export class TenantDatabaseModule {}
