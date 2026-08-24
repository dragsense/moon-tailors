import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BaseUsersModule, PermissionsModule } from "../../common/base";
import {
  AccessGuard,
  AuthGuard,
  PermissionGuard,
} from "../../common/auth";
import type { AuthConfig } from "../../config";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RefreshTokenEntity } from "./entities/refresh-token.entity";
import { TokenService } from "./services/tokens.service";

@Module({
  imports: [
    UsersModule,
    BaseUsersModule,
    PermissionsModule,
    TypeOrmModule.forFeature([
      RefreshTokenEntity,
    ]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const auth = config.getOrThrow<AuthConfig>("auth");
        return {
          secret: auth.jwtSecret,
          signOptions: { expiresIn: auth.accessTtlSeconds },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
