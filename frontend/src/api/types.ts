export interface User {
  id: string;
  login: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  initials: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  timezone: string;
}

export interface RoomFeature {
  code: string;
  name: string;
}

export interface Room {
  id: string;
  officeId: string;
  name: string;
  floor: number;
  capacity: number;
  features: RoomFeature[];
}

export interface RoomSummary extends Room {
  office: Office;
  available?: boolean;
}

export interface Booking {
  id: string;
  roomId: string;
  userId: string;
  title: string;
  comment: string | null;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  room: Room;
  office: Office;
  owner: User;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface RealtimeEvent<T = Record<string, unknown>> {
  type:
    | 'booking.created'
    | 'booking.cancelled'
    | 'room.availability_changed'
    | 'data.reset'
    | string;
  occurredAt: string;
  data: T;
}

export interface RoomAvailabilityEventData {
  roomId: string;
  officeId: string;
  startsAt: string;
  endsAt: string;
  available: boolean;
}

export interface BookingEventData {
  booking: Booking;
}
