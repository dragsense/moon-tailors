import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OnEvent } from "@nestjs/event-emitter";
import type { AppConfig } from "../../../config";
import {
  runWithEventContext,
  type EventPayload,
} from "../../../common/events";
import type { UserEntity } from "../../../common/base";
import { BaseUsersService } from "../../../common/base";
import { UserEmailService } from "./user-email.service";

/**
 * User domain listeners — tenant-aware welcome email on create.
 */
@Injectable()
export class UserEventListener {
  private readonly logger = new Logger(UserEventListener.name);

  constructor(
    private readonly users: BaseUsersService,
    private readonly userEmail: UserEmailService,
    private readonly config: ConfigService,
  ) {}

  @OnEvent("user.crud.create")
  async handleUserCreated(payload: EventPayload): Promise<void> {
    await runWithEventContext(payload, async () => {
      const data = payload.data as
        | { tempPassword?: string; createdBy?: string }
        | undefined;
      const entityId = payload.entityId;
      if (!entityId) {
        this.logger.warn("user.crud.create missing entityId — skipped");
        return;
      }

      try {
        const payloadEntity = payload.entity as
          | (Partial<UserEntity> & { password?: string; name?: string })
          | undefined;

        const tempPassword =
          data?.tempPassword ??
          (typeof payloadEntity?.password === "string"
            ? payloadEntity.password
            : undefined);

        let user = await this.users.findById(entityId);
        if (!user && payloadEntity?.email) {
          user = {
            id: entityId,
            email: payloadEntity.email,
            firstName:
              payloadEntity.firstName ??
              payloadEntity.name?.split(" ")[0] ??
              "there",
            lastName: payloadEntity.lastName ?? "",
          } as UserEntity;
        }

        if (!user?.email) {
          this.logger.warn(
            `user.crud.create ${entityId}: user/email missing — skipped welcome email`,
          );
          return;
        }

        const app = this.config.getOrThrow<AppConfig>("app");
        const loginUrl = `${app.appUrl.replace(/\/$/, "")}/login`;

        await this.userEmail.sendWelcomeEmail({
          user,
          tempPassword,
          loginUrl,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send welcome email for ${entityId}: ${message}`,
        );
      }
    });
  }

  @OnEvent("users.http.*")
  async onHttp(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      this.logger.debug(
        `users.http ${payload.operation} ${(payload.data as { endpoint?: string })?.endpoint}`,
      );
    });
  }
}
