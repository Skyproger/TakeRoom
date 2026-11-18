import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

describe('NestJS integration', () => {
  it('keeps the error envelope for unknown routes and malformed JSON', async () => {
    const app = await buildTestApp();
    const missing = await app.inject({ method: 'GET', url: '/missing' });
    expect(missing.statusCode).toBe(404);
    expect(missing.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });

    const malformed = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { 'content-type': 'application/json' },
      payload: '{',
    });
    expect(malformed.statusCode).toBe(400);
    expect(malformed.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('rejects impossible calendar dates before calling the booking service', async () => {
    const app = await buildTestApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      payload: {
        roomId: 'room-everest',
        title: 'Встреча',
        startsAt: '2027-02-30T10:00:00Z',
        endsAt: '2027-02-30T11:00:00Z',
      },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('hides reset and documentation when configured for production', async () => {
    const app = await buildTestApp({ environment: 'production', enableTestReset: false });
    for (const url of ['/documentation', '/documentation/json']) {
      expect((await app.inject({ method: 'GET', url })).statusCode).toBe(404);
    }
    expect((await app.inject({ method: 'POST', url: '/api/v1/test/reset' })).statusCode).toBe(404);
  });

  it('serves Swagger UI and explains ordinary HTTP requests to the websocket path', async () => {
    const app = await buildTestApp();
    const docs = await app.inject({ method: 'GET', url: '/documentation' });
    expect(docs.statusCode).toBe(200);
    expect(docs.headers['content-type']).toContain('text/html');
    const response = await app.inject({ method: 'GET', url: '/api/v1/ws' });
    expect(response.statusCode).toBe(426);
    expect(response.json()).toMatchObject({ error: { code: 'WEBSOCKET_UPGRADE_REQUIRED' } });
  });

  it('creates only one booking for simultaneous requests to the same interval', async () => {
    const app = await buildTestApp();
    const payload = {
      roomId: 'room-everest',
      title: 'Встреча',
      startsAt: '2026-08-19T10:00:00.000Z',
      endsAt: '2026-08-19T11:00:00.000Z',
    };
    const responses = await Promise.all([
      app.inject({ method: 'POST', url: '/api/v1/bookings', payload }),
      app.inject({ method: 'POST', url: '/api/v1/bookings', payload }),
    ]);
    expect(responses.map((response) => response.statusCode).sort()).toEqual([201, 409]);
    const bookings = await app.inject({ method: 'GET', url: '/api/v1/bookings' });
    const body = bookings.json<{ items: { title: string }[] }>();
    expect(body.items.filter((booking) => booking.title === payload.title)).toHaveLength(1);
  });
});
