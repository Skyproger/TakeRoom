import type { Booking } from '../../api/types';
import { Button } from '../ui/Button';
import { BuildingIcon } from '../ui/Icon';
import { pad2, monthShortLabel, toZonedParts, formatRangeHm } from '../../lib/datetime';

interface BookingRowProps {
  booking: Booking;
  onCancel?: (booking: Booking) => void;
  cancelling?: boolean;
  showCancel?: boolean;
}

export function BookingRow({ booking, onCancel, cancelling, showCancel = true }: BookingRowProps) {
  const tz = booking.office.timezone;
  const start = toZonedParts(booking.startsAt, tz);
  const end = toZonedParts(booking.endsAt, tz);

  return (
    <article className="booking-row">
      <div className="booking-date">
        <span className="text-sm font-medium text-ink-500">
          {monthShortLabel(start.month).toLocaleLowerCase('ru-RU')}
        </span>
        <span className="text-xl font-bold leading-none">{pad2(start.day)}</span>
      </div>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-ink-900">{booking.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5 text-brand-600">
            <BuildingIcon size={14} />
            {booking.room.name}
          </span>
          <span>{booking.room.floor} этаж</span>
          <span>
            {formatRangeHm(start, end)} <TimezoneBadge tz={tz} />
          </span>
        </div>
      </div>
      {showCancel && onCancel && (
        <Button
          variant="dangerOutline"
          size="sm"
          onClick={() => onCancel(booking)}
          disabled={cancelling}
        >
          {cancelling ? 'Отмена…' : 'Отменить'}
        </Button>
      )}
    </article>
  );
}

function TimezoneBadge({ tz }: { tz: string }) {
  const now = new Date();
  const short =
    new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      timeZoneName: 'short',
    })
      .formatToParts(now)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const label = short.startsWith('GMT+3') ? 'MSK' : short.replace('GMT', 'UTC');
  return <span className="text-xs text-ink-500">{label}</span>;
}
