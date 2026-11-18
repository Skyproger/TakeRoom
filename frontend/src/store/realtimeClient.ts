import { createRealtimeClient, type RealtimeClient } from '../api/realtime';

let client: RealtimeClient | null = null;

export function getRealtimeClient(): RealtimeClient {
  if (!client) {
    client = createRealtimeClient();
  }
  return client;
}
