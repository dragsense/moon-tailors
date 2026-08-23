import { registerAs } from "@nestjs/config";

export type PlatformOwnerConfig = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export default registerAs(
  "platformOwner",
  (): PlatformOwnerConfig => ({
    email: process.env.PLATFORM_OWNER_EMAIL || "owner@email.com",
    password: process.env.PLATFORM_OWNER_PASSWORD || "admin123",
    firstName: process.env.PLATFORM_OWNER_FIRST_NAME || "John",
    lastName: process.env.PLATFORM_OWNER_LAST_NAME || "Doe",
  }),
);
