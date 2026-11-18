import type { ApiErrorPayload } from './types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.error.message);
    this.name = 'ApiError';
    this.code = payload.error.code;
    this.status = status;
    this.details = payload.error.details;
  }

  get isConflict(): boolean {
    return this.status === 409 || this.code === 'BOOKING_CONFLICT';
  }
}
