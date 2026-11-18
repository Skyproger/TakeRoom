import { Link } from 'react-router-dom';
import type { RoomSummary } from '../../api/types';
import { Button } from '../ui/Button';
import { ClockIcon, UsersIcon } from '../ui/Icon';
import { toZonedParts, formatHm } from '../../lib/datetime';

interface RoomCardProps {
  room: RoomSummary;
  timezone: string;
  filterEnabled: boolean;
  nextBookingHint?: { startsAt: string; endsAt: string } | null;
  onBook?: (room: RoomSummary) => void;
}

export function RoomCard({
  room,
  timezone,
  filterEnabled,
  nextBookingHint,
  onBook,
}: RoomCardProps) {
  const available = room.available ?? true;

  const availabilityMessage = (() => {
    if (!filterEnabled) return null;
    if (available) return 'Доступно на выбранное время';
    return 'Недоступно на выбранное время';
  })();

  const nextHint = (() => {
    if (!nextBookingHint) return null;
    const end = toZonedParts(nextBookingHint.endsAt, timezone);
    const start = toZonedParts(nextBookingHint.startsAt, timezone);
    const now = Date.now();
    if (new Date(nextBookingHint.endsAt).getTime() < now) return 'Свободна в оставшееся время';
    if (new Date(nextBookingHint.startsAt).getTime() > now) return `Занята с ${formatHm(start)}`;
    return `Занята до ${formatHm(end)}`;
  })();

  return (
    <article className="room-row">
      <header className="room-name">
        <h3>{room.name}</h3>
        <p>{room.floor} этаж</p>
      </header>
      <div className="room-capacity">
        <UsersIcon size={17} />
        <span>Вместимость: до {room.capacity} человек</span>
      </div>
      <div className="room-availability">
        {availabilityMessage && (
          <p className={available ? 'availability available' : 'availability unavailable'}>
            {availabilityMessage}
          </p>
        )}
        {nextHint && (
          <p className="room-hint">
            <ClockIcon size={14} />
            {nextHint}
          </p>
        )}
      </div>
      <div className="room-actions">
        <Link className="detail-link" to={`/rooms/${encodeURIComponent(room.id)}`}>
          Подробнее
        </Link>
        <Button disabled={filterEnabled && !available} onClick={() => onBook?.(room)}>
          Забронировать
        </Button>
      </div>
    </article>
  );
}
