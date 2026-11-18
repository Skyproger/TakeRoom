import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { WsAdapter } from '@nestjs/platform-ws';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Clock } from './clock.js';
import { SystemClock } from './clock.js';
import { loadConfig, type AppConfig } from './config.js';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';

export interface AppOptions {
  clock?: Clock;
  config?: AppConfig;
  logger?: boolean;
}

export async function buildApp(options: AppOptions = {}): Promise<NestFastifyApplication> {
  const config = options.config ?? loadConfig();
  const clock = options.clock ?? new SystemClock();
  const adapter = new FastifyAdapter({
    logger: options.logger ? { level: config.logLevel } : false,
  });
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule.register(config, clock),
    adapter,
    {
      logger: options.logger ? ['log', 'warn', 'error'] : false,
      abortOnError: false,
    },
  );

  app.enableCors({ origin: config.corsOrigins });
  app.useGlobalFilters(new ApiExceptionFilter());
  // Этот адаптер работает с обычным браузерным WebSocket.
  app.useWebSocketAdapter(new WsAdapter(app));

  if (config.environment !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Сервис бронирования переговорных')
      .setDescription('REST и WebSocket API на NestJS')
      .setVersion('1.0.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('documentation', app, document, { jsonDocumentUrl: 'documentation/json' });
  }

  await app.init();
  await adapter.getInstance().ready();
  return app;
}
