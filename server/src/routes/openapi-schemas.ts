import type { SchemaObject } from '@nestjs/swagger';

export const errorResponseSchema: SchemaObject = {
  type: 'object',
  required: ['error'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object', additionalProperties: true },
      },
    },
  },
};

export const userSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'login', 'displayName', 'email', 'avatarUrl', 'initials'],
  properties: {
    id: { type: 'string' },
    login: { type: 'string' },
    displayName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    avatarUrl: { type: 'string', nullable: true },
    initials: { type: 'string' },
  },
};

export const officeSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'name', 'address', 'timezone'],
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    address: { type: 'string' },
    timezone: { type: 'string' },
  },
};

const featureSchema: SchemaObject = {
  type: 'object',
  required: ['code', 'name'],
  properties: {
    code: { type: 'string' },
    name: { type: 'string' },
  },
};

export const roomSchema: SchemaObject = {
  type: 'object',
  required: ['id', 'officeId', 'name', 'floor', 'capacity', 'features', 'office'],
  properties: {
    id: { type: 'string' },
    officeId: { type: 'string' },
    name: { type: 'string' },
    floor: { type: 'integer' },
    capacity: { type: 'integer' },
    features: { type: 'array', items: featureSchema },
    office: officeSchema,
    available: { type: 'boolean' },
  },
};

export const bookingSchema: SchemaObject = {
  type: 'object',
  required: [
    'id',
    'roomId',
    'userId',
    'title',
    'comment',
    'startsAt',
    'endsAt',
    'createdAt',
    'room',
    'office',
    'owner',
  ],
  properties: {
    id: { type: 'string' },
    roomId: { type: 'string' },
    userId: { type: 'string' },
    title: { type: 'string' },
    comment: { type: 'string', nullable: true },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
    createdAt: { type: 'string', format: 'date-time' },
    room: {
      type: 'object',
      required: ['id', 'officeId', 'name', 'floor', 'capacity', 'features'],
      properties: {
        id: { type: 'string' },
        officeId: { type: 'string' },
        name: { type: 'string' },
        floor: { type: 'integer' },
        capacity: { type: 'integer' },
        features: { type: 'array', items: featureSchema },
      },
    },
    office: officeSchema,
    owner: userSchema,
  },
};

export const createBookingBodySchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  required: ['roomId', 'title', 'startsAt', 'endsAt'],
  properties: {
    roomId: { type: 'string', minLength: 1, maxLength: 100 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    comment: { type: 'string', maxLength: 2_000, nullable: true },
    startsAt: { type: 'string', format: 'date-time' },
    endsAt: { type: 'string', format: 'date-time' },
  },
};

export function itemsSchema(item: SchemaObject): SchemaObject {
  return {
    type: 'object',
    required: ['items'],
    properties: { items: { type: 'array', items: item } },
  };
}
