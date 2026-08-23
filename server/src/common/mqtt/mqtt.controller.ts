import { Controller } from "@nestjs/common";
import {
  Ctx,
  MessagePattern,
  Payload,
  Transport,
  type MqttContext,
} from "@nestjs/microservices";
import { AppLoggerService } from "../logging";

@Controller()
export class MqttController {
  constructor(private readonly logger: AppLoggerService) {}

  /**
   * Handle messages on template/# (all subtopics under template/).
   * Pattern = MQTT topic; Transport.MQTT binds to MQTT microservice only.
   */
  @MessagePattern("template/#", Transport.MQTT)
  handleTemplateMessages(
    @Payload() data: Buffer,
    @Ctx() context: MqttContext,
  ) {
    const topic = context.getTopic();
    const msg = data?.toString?.() || "";
    try {
      const parsed = JSON.parse(msg);
      this.logger.log(
        `MQTT [${topic}]: ${JSON.stringify(parsed)}`,
        "MqttController",
      );
    } catch {
      this.logger.log(`MQTT [${topic}]: ${msg}`, "MqttController");
    }
  }
}
