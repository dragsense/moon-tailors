import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EUserLevel } from "@template/contracts";
import { RequireUserLevels } from "../auth";
import { DomainEventRegistry } from "./domain-event.registry";
import { EventService } from "./event.service";

@ApiTags("Events")
@Controller("events")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER,
  EUserLevel.SUPER_ADMIN,
  EUserLevel.ADMIN,
)
export class EventsController {
  constructor(private readonly events: EventService) {}

  /** Inspect enable flag + registered endpoint/source rules. */
  @Get("registry")
  registry() {
    return {
      enabled: this.events.isGloballyEnabled(),
      rules: DomainEventRegistry.list(),
    };
  }
}
