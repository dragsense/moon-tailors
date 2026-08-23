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
import { ApiKeysModule } from "../api-keys";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { OtpChallengeEntity } from "./entities/otp-challenge.entity";
import { RefreshTokenEntity } from "./entities/refresh-token.entity";
import { TrustedDeviceEntity } from "./entities/trusted-device.entity";
import { AuthMailService } from "./services/auth-mail.service";
import { OtpService } from "./services/otp.service";
import { TokenService } from "./services/tokens.service";
import { TrustedDeviceService } from "./services/trusted-device.service";

@Module({
  imports: [
    UsersModule,
    BaseUsersModule,
    PermissionsModule,
    ApiKeysModule,
    TypeOrmModule.forFeature([
      OtpChallengeEntity,
      RefreshTokenEntity,
      TrustedDeviceEntity,
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
    AuthMailService,
    OtpService,
    TokenService,
    TrustedDeviceService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: AccessGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
  exports: [AuthService, TokenService, TrustedDeviceService],
})
export class AuthModule {}
