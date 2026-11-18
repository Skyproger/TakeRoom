import { Module, type DynamicModule } from '@nestjs/common';
import type { Clock } from './clock.js';
import type { AppConfig } from './config.js';
import { CLOCK } from './tokens.js';
import { MemoryStore } from './store/memory-store.js';
import { BookingService } from './services/booking-service.js';
import { WebSocketHub } from './realtime/websocket-hub.js';
import { BookingsGateway } from './realtime/bookings.gateway.js';
import { BookingsController } from './controllers/bookings.controller.js';
import { RoomsController } from './controllers/rooms.controller.js';
import { OfficesController } from './controllers/offices.controller.js';
import { SystemController } from './controllers/system.controller.js';
import { TestResetController } from './controllers/test-reset.controller.js';

@Module({})
export class AppModule {
  // В тестах передаём фиксированные часы. Все провайдеры используют один экземпляр часов.
  static register(config: AppConfig, clock: Clock): DynamicModule {
    return {
      module: AppModule,
      controllers: [
        BookingsController,
        RoomsController,
        OfficesController,
        SystemController,
        ...(config.enableTestReset ? [TestResetController] : []),
      ],
      providers: [
        { provide: CLOCK, useValue: clock },
        MemoryStore,
        BookingService,
        {
          provide: WebSocketHub,
          useFactory: (appClock: Clock) => new WebSocketHub(appClock),
          inject: [CLOCK],
        },
        BookingsGateway,
      ],
    };
  }
}
