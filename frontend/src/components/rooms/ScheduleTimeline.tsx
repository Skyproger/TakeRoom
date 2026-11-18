import { useMemo } from 'react';
import type { Booking } from '../../api/types';
import {
  WORK_END_MINUTES,
  WORK_START_MINUTES,
  formatHm,
  minutesFromParts,
  partsFromMinutes,
  toZonedParts,
} from '../../lib/datetime';

interface ScheduleTimelineProps {
  bookings: Booking[];
  timezone: string;
  currentUserId: string | null;
}

const HOUR_ROW_HEIGHT = 44;

export function ScheduleTimeline({ bookings, timezone, currentUserId }: ScheduleTimelineProps) {
  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = 9; hour <= 20; hour += 1) list.push(hour);
    return list;
  }, []);

  const entries = useMemo(() => {
    return bookings
      .map((booking) => {
        const start = toZonedParts(booking.startsAt, timezone);
        const end = toZonedParts(booking.endsAt, timezone);
        const startMinutes = clamp(minutesFromParts(start));
        const endMinutes = clamp(minutesFromParts(end), true);
        if (endMinutes <= startMinutes) return null;
        return {
          booking,
          startMinutes,
          endMinutes,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [bookings, timezone]);

  const totalMinutes = WORK_END_MINUTES - WORK_START_MINUTES;
  const totalHeight = HOUR_ROW_HEIGHT * (hours.length - 1);

  return (
    <div className="schedule-timeline" style={{ height: totalHeight + 24 }}>
      {hours.map((hour) => (
        <div key={hour} className="schedule-hour" style={{ height: HOUR_ROW_HEIGHT }}>
          <span className="schedule-time">{formatHm({ hour, minute: 0 })}</span>
        </div>
      ))}

      {entries.map(({ booking, startMinutes, endMinutes }) => {
        const top = ((startMinutes - WORK_START_MINUTES) / totalMinutes) * totalHeight;
        const height = Math.max(24, ((endMinutes - startMinutes) / totalMinutes) * totalHeight);
        const mine = booking.userId === currentUserId;
        return (
          <div
            key={booking.id}
            className={[
              'schedule-booking',
              mine
                ? 'border border-brand-200 bg-brand-100 text-brand-800'
                : 'bg-ink-100 text-ink-500',
            ].join(' ')}
            style={{ top, height }}
          >
            {mine ? booking.title : 'Занято'}
            {mine && booking.owner && (
              <span className="ml-2 text-xs text-brand-700/80">
                {formatHm(partsFromMinutes(startMinutes))} до{' '}
                {formatHm(partsFromMinutes(endMinutes))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function clamp(minutes: number, roundUp = false): number {
  if (minutes < WORK_START_MINUTES) return WORK_START_MINUTES;
  if (minutes > WORK_END_MINUTES) return roundUp ? WORK_END_MINUTES : WORK_END_MINUTES;
  return minutes;
}
