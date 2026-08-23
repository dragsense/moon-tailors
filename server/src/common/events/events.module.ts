import { Global, Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { DomainEventRegistry } from "./domain-event.registry";
import { EventService } from "./event.service";
import { EventsController } from "./events.controller";
import { DomainEventInterceptor } from "./interceptors/domain-event.interceptor";

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: ".",
      maxListeners: 20,
      ignoreErrors: false,
    }),
  ],
  controllers: [EventsController],
  providers: [
    EventService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DomainEventInterceptor,
    },
  ],
  exports: [EventService],
})
export class EventsModule implements OnModuleInit {
  onModuleInit() {
    DomainEventRegistry.register({
      module: "events",
      events: { endpoint: "/api/events" },
    });
  }
}
