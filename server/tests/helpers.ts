import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { buildApp } from '../src/app.js';
import type { Clock } from '../src/clock.js';
import type { AppConfig } from '../src/config.js';

const apps = new Set<NestFastifyApplication>();
export const TEST_NOW = new Date('2026-08-18T09:00:00.000Z');

class FixedClock implements Clock {
  now(): Date {
    return new Date(TEST_NOW);
  }
}

const testConfig: AppConfig = {
  host: '127.0.0.1',
  port: 0,
  logLevel: 'silent',
  corsOrigins: ['http://localhost:5173'],
  enableTestReset: true,
  environment: 'test',
};

export async function buildTestApp(
  config: Partial<AppConfig> = {},
): Promise<NestFastifyApplication> {
  const app = await buildApp({
    logger: false,
    clock: new FixedClock(),
    config: { ...testConfig, ...config },
  });
  apps.add(app);
  return app;
}

export async function closeTestApps(): Promise<void> {
  await Promise.all([...apps].map(async (app) => app.close()));
  apps.clear();
}
