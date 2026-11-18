import { Controller, Get, Inject } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { MemoryStore } from '../store/memory-store.js';
import { itemsSchema, officeSchema } from '../routes/openapi-schemas.js';

@ApiTags('Офисы')
@Controller('api/v1/offices')
export class OfficesController {
  constructor(@Inject(MemoryStore) private readonly store: MemoryStore) {}

  @Get()
  @ApiResponse({ status: 200, schema: itemsSchema(officeSchema) })
  list() {
    return { items: this.store.listOffices() };
  }
}
