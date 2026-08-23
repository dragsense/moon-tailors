import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientProxy } from "@nestjs/microservices";
import { AppLoggerService } from "../logging";
import type { MqttConfig } from "../../config";
import { MQTT_CLIENT } from "./mqtt.constants";

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(MQTT_CLIENT) private readonly client: ClientProxy,
    private readonly config: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  async onModuleInit() {
    const mqtt = this.config.getOrThrow<MqttConfig>("mqtt");
    if (!mqtt.enabled) {
      this.logger.log("MQTT is disabled", "MqttService");
      return;
    }
    try {
      await this.client.connect();
      this.logger.log("MQTT client connected (publisher)", "MqttService");
    } catch (err) {
      this.logger.error("MQTT client connect failed", err, "MqttService");
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.close();
    } catch {
      // ignore
    }
  }

  /**
   * Publish to MQTT topic. Topic = pattern for NestJS MQTT.
   * Uses emit (fire-and-forget) — no response expected.
   */
  publish(topic: string, payload: string | object): boolean {
    const mqtt = this.config.getOrThrow<MqttConfig>("mqtt");
    if (!mqtt.enabled) return false;

    const data = typeof payload === "object" ? payload : { message: payload };
    try {
      this.client.emit(topic, data);
      return true;
    } catch (err) {
      this.logger.error(
        `MQTT publish error for ${topic}`,
        err,
        "MqttService",
      );
      return false;
    }
  }
}
