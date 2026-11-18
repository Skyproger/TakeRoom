import { afterEach, describe, expect, it } from 'vitest';
import { buildTestApp, closeTestApps } from './helpers.js';

afterEach(closeTestApps);

interface OpenApiOperation {
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  parameters?: unknown[];
}

interface OpenApiDocument {
  paths?: Record<string, { get?: OpenApiOperation; post?: OpenApiOperation }>;
}

describe('OpenAPI', () => {
  it('documents every public HTTP and WebSocket route', async () => {
    const app = await buildTestApp();
    const response = await app.inject({ method: 'GET', url: '/documentation/json' });
    expect(response.statusCode).toBe(200);
    const document = response.json<OpenApiDocument>();

    expect(Object.keys(document.paths ?? {})).toEqual(
      expect.arrayContaining([
        '/health',
        '/api/v1/me',
        '/api/v1/offices',
        '/api/v1/rooms',
        '/api/v1/rooms/{roomId}',
        '/api/v1/rooms/{roomId}/bookings',
        '/api/v1/bookings',
        '/api/v1/bookings/{bookingId}',
        '/api/v1/test/reset',
        '/api/v1/ws',
      ]),
    );

    const createBooking = document.paths?.['/api/v1/bookings']?.post;
    expect(createBooking?.requestBody).toMatchObject({ required: true });
    expect(createBooking?.responses).toMatchObject({
      '201': expect.any(Object),
      '400': expect.any(Object),
      '409': expect.any(Object),
    });

    const rooms = document.paths?.['/api/v1/rooms']?.get;
    expect(rooms?.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'officeId', required: true })]),
    );
  });
});
