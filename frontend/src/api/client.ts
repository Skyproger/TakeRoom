import { ApiError } from './errors';
import type {
  ApiErrorPayload,
  Booking,
  Office,
  RoomSummary,
  User,
} from './types';

const API_BASE = '/api/v1';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : undefined;

  if (!response.ok) {
    const errorPayload = (payload as ApiErrorPayload | undefined) ?? {
      error: { code: 'UNKNOWN_ERROR', message: 'Ошибка запроса' },
    };
    throw new ApiError(response.status, errorPayload);
  }

  return payload as T;
}

export interface ListRoomsParams {
  officeId: string;
  minCapacity?: number;
  from?: string;
  to?: string;
}

export interface ListBookingsParams {
  scope?: 'upcoming' | 'past' | 'all';
  officeId?: string;
}

export interface CreateBookingPayload {
  roomId: string;
  title: string;
  comment?: string | null;
  startsAt: string;
  endsAt: string;
}

export interface ItemsResponse<T> {
  items: T[];
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api = {
  getMe(signal?: AbortSignal) {
    return request<User>('/me', { signal });
  },
  listOffices(signal?: AbortSignal) {
    return request<ItemsResponse<Office>>('/offices', { signal });
  },
  listRooms(params: ListRoomsParams, signal?: AbortSignal) {
    return request<ItemsResponse<RoomSummary>>(`/rooms${toQuery({ ...params })}`, {
      signal,
    });
  },
  getRoom(roomId: string, signal?: AbortSignal) {
    return request<RoomSummary>(`/rooms/${encodeURIComponent(roomId)}`, {
      signal,
    });
  },
  getRoomSchedule(
    roomId: string,
    range: { from: string; to: string },
    signal?: AbortSignal,
  ) {
    return request<ItemsResponse<Booking>>(
      `/rooms/${encodeURIComponent(roomId)}/bookings${toQuery(range)}`,
      { signal },
    );
  },
  listMyBookings(params: ListBookingsParams = {}, signal?: AbortSignal) {
    return request<ItemsResponse<Booking>>(`/bookings${toQuery({ ...params })}`, {
      signal,
    });
  },
  createBooking(payload: CreateBookingPayload) {
    return request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  cancelBooking(bookingId: string) {
    return request<void>(`/bookings/${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    });
  },
};
