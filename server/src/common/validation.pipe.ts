import { PipeTransform } from '@nestjs/common';
import { z } from 'zod';
import { parseRequest } from '../routes/schemas.js';

// Проверяем данные на входе в контроллер. Сервис получает уже проверенные значения.
export class ValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: z.ZodType<T>) {}

  transform(value: unknown): T {
    return parseRequest(this.schema, value);
  }
}
