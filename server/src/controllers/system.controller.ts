import { Controller, Get, HttpCode, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MemoryStore } from '../store/memory-store.js';
import { userSchema } from '../routes/openapi-schemas.js';

@Controller()
export class SystemController {
  constructor(@Inject(MemoryStore) private readonly store: MemoryStore) {}

  @Get('health')
  @ApiOperation({ summary: 'Проверка состояния сервиса' })
  health() {
    return { status: 'ok' };
  }

  @Get('api/v1/me')
  @ApiResponse({ status: 200, schema: userSchema })
  me() {
    return this.store.getCurrentUser();
  }

  @Get('api/v1/ws')
  @HttpCode(426)
  @ApiOperation({
    summary: 'WebSocket с обновлениями бронирований',
    description:
      'События booking.created, booking.cancelled, room.availability_changed и data.reset. Требуется WebSocket upgrade.',
  })
  websocket() {
    return {
      error: {
        code: 'WEBSOCKET_UPGRADE_REQUIRED',
        message: 'Для подключения необходимо использовать WebSocket',
      },
    };
  }
}
