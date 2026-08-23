import { Global, Module } from "@nestjs/common";
import { ServerGateway } from "./server.gateway";

@Global()
@Module({
  providers: [ServerGateway],
  exports: [ServerGateway],
})
export class ServerGatewayModule {}
