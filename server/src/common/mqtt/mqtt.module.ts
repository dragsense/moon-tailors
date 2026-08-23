import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import type { MqttConfig } from "../../config";
import { MQTT_CLIENT } from "./mqtt.constants";
import { MqttController } from "./mqtt.controller";
import { MqttService } from "./mqtt.service";

@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: MQTT_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
          const mqtt = config.get<MqttConfig>("mqtt");
          if (!mqtt?.enabled) {
            return { transport: Transport.MQTT, options: {} };
          }
          return {
            transport: Transport.MQTT,
            options: {
              url: mqtt.url,
              clientId: mqtt.publisherClientId,
            },
          };
        },
      },
    ]),
  ],
  controllers: [MqttController],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
