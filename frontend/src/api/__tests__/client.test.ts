import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../client';
import { ApiError } from '../errors';

const originalFetch = global.fetch;

function mockFetch(status: number, body?: unknown) {
  return vi.fn(async (_input: unknown, _init?: unknown) => {
    void _input;
    void _init;
    const noBodyStatus = status === 204 || status === 205 || status === 304;
    const responseBody = noBodyStatus
      ? null
      : body === undefined
        ? ''
        : JSON.stringify(body);
    return new Response(responseBody, {
      status,
      headers: noBodyStatus ? undefined : { 'content-type': 'application/json' },
    });
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('api client', () => {
  it('запрашивает /rooms с корректным query', async () => {
    const fetchMock = mockFetch(200, { items: [] });
    global.fetch = fetchMock as unknown as typeof fetch;
    await api.listRooms({
      officeId: 'office-1',
      minCapacity: 4,
      from: '2026-01-01T09:00:00.000Z',
      to: '2026-01-01T10:00:00.000Z',
    });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      '/api/v1/rooms?officeId=office-1&minCapacity=4&from=2026-01-01T09%3A00%3A00.000Z&to=2026-01-01T10%3A00%3A00.000Z',
    );
  });

  it('обрабатывает 204 без тела', async () => {
    const fetchMock = mockFetch(204);
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(api.cancelBooking('booking-1')).resolves.toBeUndefined();
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('/api/v1/bookings/booking-1');
    expect(init).toMatchObject({ method: 'DELETE' });
  });

  it('превращает 409 в ApiError с isConflict', async () => {
    const fetchMock = mockFetch(409, {
      error: { code: 'BOOKING_CONFLICT', message: 'занято' },
    });
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(
      api.createBooking({
        roomId: 'r1',
        title: 't',
        startsAt: '2026-01-01T09:00:00.000Z',
        endsAt: '2026-01-01T10:00:00.000Z',
      }),
    ).rejects.toMatchObject({ status: 409, code: 'BOOKING_CONFLICT' });
    try {
      await api.createBooking({
        roomId: 'r1',
        title: 't',
        startsAt: '2026-01-01T09:00:00.000Z',
        endsAt: '2026-01-01T10:00:00.000Z',
      });
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).isConflict).toBe(true);
    }
  });
});
