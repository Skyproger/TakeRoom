import { useEffect } from 'react';
import type { RealtimeEvent } from '../api/types';
import { getRealtimeClient } from '../store/realtimeClient';

export function useRealtimeEvent(handler: (event: RealtimeEvent) => void): void {
  useEffect(() => {
    const client = getRealtimeClient();
    return client.subscribe(handler);
  }, [handler]);
}
