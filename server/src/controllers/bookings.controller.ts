import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ValidationPipe } from '../common/validation.pipe.js';
import { BookingService } from '../services/booking-service.js';
import { WebSocketHub } from '../realtime/websocket-hub.js';
import {
  bookingParamsSchema,
  bookingsQuerySchema,
  createBookingSchema,
} from '../routes/schemas.js';
import {
  bookingSchema,
  createBookingBodySchema,
  errorResponseSchema,
  itemsSchema,
} from '../routes/openapi-schemas.js';

@ApiTags('Бронирования')
@Controller('api/v1/bookings')
export class BookingsController {
  constructor(
    @Inject(BookingService) private readonly bookings: BookingService,
    @Inject(WebSocketHub) private readonly realtime: WebSocketHub,
  ) {}

  @Get()
  @ApiQuery({ name: 'scope', required: false, enum: ['upcoming', 'past', 'all'] })
  @ApiQuery({ name: 'officeId', required: false })
  @ApiResponse({ status: 200, schema: itemsSchema(bookingSchema) })
  list(@Query(new ValidationPipe(bookingsQuerySchema)) query: z.infer<typeof bookingsQuerySchema>) {
    return {
      items: this.bookings.listCurrentUserBookings({
        scope: query.scope,
        ...(query.officeId ? { officeId: query.officeId } : {}),
      }),
    };
  }

  @Post()
  @ApiBody({ schema: createBookingBodySchema })
  @ApiResponse({ status: 201, schema: bookingSchema })
  @ApiResponse({ status: 400, schema: errorResponseSchema })
  @ApiResponse({ status: 404, schema: errorResponseSchema })
  @ApiResponse({ status: 409, schema: errorResponseSchema })
  create(@Body(new ValidationPipe(createBookingSchema)) body: z.infer<typeof createBookingSchema>) {
    const booking = this.bookings.createBooking({
      roomId: body.roomId,
      title: body.title,
      ...(body.comment === undefined ? {} : { comment: body.comment }),
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
    });
    // Рассылка происходит только после успешного сохранения брони.
    this.realtime.broadcast('booking.created', { booking });
    this.realtime.broadcast('room.availability_changed', {
      roomId: booking.roomId,
      officeId: booking.office.id,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      available: false,
    });
    return booking;
  }

  @Delete(':bookingId')
  @ApiParam({ name: 'bookingId', type: String })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Бронирование отменено' })
  @ApiResponse({ status: 400, schema: errorResponseSchema })
  @ApiResponse({ status: 403, schema: errorResponseSchema })
  @ApiResponse({ status: 404, schema: errorResponseSchema })
  cancel(
    @Param(new ValidationPipe(bookingParamsSchema)) params: z.infer<typeof bookingParamsSchema>,
  ): void {
    const booking = this.bookings.cancelBooking(params.bookingId);
    this.realtime.broadcast('booking.cancelled', { booking });
    this.realtime.broadcast('room.availability_changed', {
      roomId: booking.roomId,
      officeId: booking.office.id,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      available: true,
    });
  }
}
