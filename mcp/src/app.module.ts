import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ApiModule } from "./common/api/api.module";
import { mcpConfig } from "./config";
import { TransportModule } from "./modules/transport";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mcpConfig],
    }),
    ApiModule,
    TransportModule,
  ],
})
export class AppModule {}
