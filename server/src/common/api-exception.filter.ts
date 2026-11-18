import { ArgumentsHost, Catch, HttpException, type ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../domain/errors.js';

// Все ошибки имеют один формат, который понимает фронтенд.
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const reply = context.getResponse<FastifyReply>();
    if (error instanceof AppError) {
      void reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
      return;
    }

    let status = 500;
    if (error instanceof HttpException) {
      status = error.getStatus();
    } else if (
      error instanceof Error &&
      'statusCode' in error &&
      typeof error.statusCode === 'number'
    ) {
      status = error.statusCode;
    }
    const messages: Record<number, { code: string; message: string }> = {
      400: { code: 'VALIDATION_ERROR', message: 'Проверьте параметры запроса' },
      404: { code: 'NOT_FOUND', message: 'Запрошенный ресурс не найден' },
      413: { code: 'PAYLOAD_TOO_LARGE', message: 'Превышен допустимый размер запроса' },
      415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Неподдерживаемый формат запроса' },
    };
    if (status >= 500) context.getRequest<FastifyRequest>().log.error(error);
    void reply.status(status).send({
      error: messages[status] ?? {
        code: 'INTERNAL_ERROR',
        message: 'Произошла внутренняя ошибка сервера',
      },
    });
  }
}
