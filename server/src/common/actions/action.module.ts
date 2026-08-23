import { Global, Module } from "@nestjs/common";
import { ActionRegistryService } from "./action-registry.service";

@Global()
@Module({
  providers: [ActionRegistryService],
  exports: [ActionRegistryService],
})
export class ActionModule {}
