import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EUserLevel } from "@moon-tailors/contracts";
import { RequireUserLevels } from "../auth";
import { DomainEventRegistry } from "./domain-event.registry";
import { EventService } from "./event.service";

@ApiTags("Events")
@Controller("events")
@RequireUserLevels(
  EUserLevel.PLATFORM_OWNER
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
