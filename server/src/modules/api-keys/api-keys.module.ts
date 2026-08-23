import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PermissionsModule } from "../../common/base";
import { ApiKeysController } from "./api-keys.controller";
import { ApiKeysService } from "./api-keys.service";
import { ApiKeyEntity } from "./entities/api-key.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKeyEntity]), PermissionsModule],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
