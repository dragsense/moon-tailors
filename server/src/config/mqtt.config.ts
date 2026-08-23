import { registerAs } from "@nestjs/config";

export type MqttConfig = {
  url: string;
  /** Client ID for microservice listener (server). */
  clientId: string;
  /** Client ID for publisher (must differ from listener in the same app). */
  publisherClientId: string;
  topics: string[];
  enabled: boolean;
};

export default registerAs(
  "mqtt",
  (): MqttConfig => ({
    url: process.env.MQTT_URL || "mqtt://mqtt:1883",
    clientId: process.env.MQTT_CLIENT_ID || "template-mqtt-server",
    publisherClientId:
      process.env.MQTT_PUBLISHER_CLIENT_ID || "template-mqtt-publisher",
    topics: (process.env.MQTT_TOPICS || "template/#")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    enabled: process.env.MQTT_ENABLED === "true",
  }),
);
