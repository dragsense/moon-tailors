import { DynamicModule, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BullBoardModule } from "@bull-board/nestjs";
import { ExpressAdapter } from "@bull-board/express";
import basicAuth from "express-basic-auth";
import type { BullBoardConfig } from "../../config/bull-board.config";

/**
 * Bull Board UI for Bull queues (`@nestjs/bull`).
 * Toggle with BULL_BOARD_ENABLED; protect with BULL_BOARD_USER/PASSWORD.
 */
@Module({})
export class AppBullBoardModule {
  static register(): DynamicModule {
    return {
      module: AppBullBoardModule,
      imports: [
        BullBoardModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const board = config.getOrThrow<BullBoardConfig>("bullBoard");
            const route = board.route.replace(/^\//, "");
            const middleware =
              board.user && board.password
                ? basicAuth({
                    challenge: true,
                    users: { [board.user]: board.password },
                  })
                : undefined;

            return {
              route,
              adapter: ExpressAdapter,
              middleware,
              boardOptions: {
                uiConfig: {
                  boardTitle: "Template queues",
                },
              },
            };
          },
        }),
      ],
    };
  }
}
