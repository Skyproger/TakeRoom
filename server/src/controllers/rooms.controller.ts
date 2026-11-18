import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import { ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ValidationPipe } from '../common/validation.pipe.js';
import { BookingService } from '../services/booking-service.js';
import { roomsQuerySchema, roomParamsSchema, scheduleQuerySchema } from '../routes/schemas.js';
import {
  roomSchema,
  bookingSchema,
  itemsSchema,
  errorResponseSchema,
} from '../routes/openapi-schemas.js';

@ApiTags('Переговорные')
@ApiResponse({ status: 400, schema: errorResponseSchema })
@ApiResponse({ status: 404, schema: errorResponseSchema })
@Controller('api/v1/rooms')
export class RoomsController {
  constructor(@Inject(BookingService) private readonly bookings: BookingService) {}

  @Get()
  @ApiQuery({ name: 'officeId', required: true })
  @ApiQuery({ name: 'minCapacity', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date-time' })
  @ApiResponse({ status: 200, schema: itemsSchema(roomSchema) })
  list(@Query(new ValidationPipe(roomsQuerySchema)) query: z.infer<typeof roomsQuerySchema>) {
    return {
      items: this.bookings.listRooms({
        officeId: query.officeId,
        ...(query.minCapacity === undefined ? {} : { minCapacity: query.minCapacity }),
        ...(query.from && query.to ? { from: new Date(query.from), to: new Date(query.to) } : {}),
      }),
    };
  }

  @Get(':roomId')
  @ApiParam({ name: 'roomId', type: String })
  @ApiResponse({ status: 200, schema: roomSchema })
  get(@Param(new ValidationPipe(roomParamsSchema)) params: z.infer<typeof roomParamsSchema>) {
    return this.bookings.getRoom(params.roomId);
  }

  @Get(':roomId/bookings')
  @ApiParam({ name: 'roomId', type: String })
  @ApiQuery({ name: 'from', required: true, type: String, format: 'date-time' })
  @ApiQuery({ name: 'to', required: true, type: String, format: 'date-time' })
  @ApiResponse({ status: 200, schema: itemsSchema(bookingSchema) })
  schedule(
    @Param(new ValidationPipe(roomParamsSchema)) params: z.infer<typeof roomParamsSchema>,
    @Query(new ValidationPipe(scheduleQuerySchema)) query: z.infer<typeof scheduleQuerySchema>,
  ) {
    return {
      items: this.bookings.getRoomSchedule({
        roomId: params.roomId,
        from: new Date(query.from),
        to: new Date(query.to),
      }),
    };
  }
}
