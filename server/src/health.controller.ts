import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/auth";

@Controller("health")
@Public()
export class HealthController {
  @Get()
  check() {
    return { status: "ok", service: "server" };
  }
}
