import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  runWithEventContext,
  type EventPayload,
} from "../../../common/events";

/**
 * User domain listeners — tenant-aware welcome email on create.
 */
@Injectable()
export class UserEventListener {
  private readonly logger = new Logger(UserEventListener.name);

  constructor(
  ) {}


  @OnEvent("users.http.*")
  async onHttp(payload: EventPayload) {
    await runWithEventContext(payload, async () => {
      this.logger.debug(
        `users.http ${payload.operation} ${(payload.data as { endpoint?: string })?.endpoint}`,
      );
    });
  }
}
