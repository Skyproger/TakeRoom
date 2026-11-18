import type { RealtimeEvent } from './types';

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

type Listener = (event: RealtimeEvent) => void;
type StatusListener = (status: ConnectionStatus) => void;

export interface RealtimeClient {
  subscribe(listener: Listener): () => void;
  onStatus(listener: StatusListener): () => void;
  getStatus(): ConnectionStatus;
  close(): void;
}

const RECONNECT_STEPS_MS = [500, 1_000, 2_000, 5_000, 10_000];

export function createRealtimeClient(path = '/api/v1/ws'): RealtimeClient {
  const listeners = new Set<Listener>();
  const statusListeners = new Set<StatusListener>();
  let socket: WebSocket | null = null;
  let attempt = 0;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let status: ConnectionStatus = 'connecting';

  const notifyStatus = (next: ConnectionStatus) => {
    if (status === next) return;
    status = next;
    for (const listener of statusListeners) listener(next);
  };

  const connect = () => {
    if (closed) return;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${window.location.host}${path}`;
    notifyStatus('connecting');
    const ws = new WebSocket(url);
    socket = ws;

    ws.addEventListener('open', () => {
      attempt = 0;
      notifyStatus('open');
    });

    ws.addEventListener('message', (message) => {
      try {
        const parsed = JSON.parse(message.data as string) as RealtimeEvent;
        for (const listener of listeners) listener(parsed);
      } catch {
        // ignore malformed events
      }
    });

    const scheduleReconnect = () => {
      if (closed) return;
      notifyStatus('closed');
      const delay =
        RECONNECT_STEPS_MS[Math.min(attempt, RECONNECT_STEPS_MS.length - 1)];
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    ws.addEventListener('close', scheduleReconnect);
    ws.addEventListener('error', () => {
      ws.close();
    });
  };

  connect();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onStatus(listener) {
      statusListeners.add(listener);
      listener(status);
      return () => statusListeners.delete(listener);
    },
    getStatus() {
      return status;
    },
    close() {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      socket?.close();
      listeners.clear();
      statusListeners.clear();
    },
  };
}
