import { Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemoryStore } from '../store/memory-store.js';
import { WebSocketHub } from '../realtime/websocket-hub.js';

// Этот контроллер подключается только при ENABLE_TEST_RESET=true.
@ApiTags('Тестирование')
@Controller('api/v1/test')
export class TestResetController {
  constructor(
    @Inject(MemoryStore) private readonly store: MemoryStore,
    @Inject(WebSocketHub) private readonly realtime: WebSocketHub,
  ) {}

  @Post('reset')
  @HttpCode(204)
  reset(): void {
    this.store.reset();
    this.realtime.broadcast('data.reset', {});
  }
}
