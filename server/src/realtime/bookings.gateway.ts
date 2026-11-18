import { Inject, type OnModuleDestroy } from '@nestjs/common';
import { WebSocketGateway, type OnGatewayConnection } from '@nestjs/websockets';
import type WebSocket from 'ws';
import { WebSocketHub } from './websocket-hub.js';

@WebSocketGateway({ path: '/api/v1/ws' })
export class BookingsGateway implements OnGatewayConnection<WebSocket>, OnModuleDestroy {
  constructor(@Inject(WebSocketHub) private readonly hub: WebSocketHub) {}

  handleConnection(client: WebSocket): void {
    this.hub.add(client);
  }

  onModuleDestroy(): void {
    this.hub.close();
  }
}
