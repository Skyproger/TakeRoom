import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Booking, RoomSummary } from '../api/types';
import { BookingFormModal } from '../components/rooms/BookingFormModal';
import { DatePickerPopover } from '../components/rooms/DatePickerPopover';
import { RoomInfoCard } from '../components/rooms/RoomInfoCard';
import { ScheduleTimeline } from '../components/rooms/ScheduleTimeline';
import { Button } from '../components/ui/Button';
import { CalendarIcon } from '../components/ui/Icon';
import { ErrorState, LoadingSkeleton } from '../components/ui/States';
import { Toast } from '../components/ui/Toast';
import { useFetch } from '../hooks/useFetch';
import { useRealtimeEvent } from '../hooks/useRealtimeEvent';
import {
  addDays,
  formatDateShort,
  formatWeekdayFull,
  isoDateFromParts,
  nowInZone,
  partsFromIsoDate,
  zonedToUtc,
} from '../lib/datetime';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/selectors';

export function RoomDetailPage() {
  const { roomId = '' } = useParams();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectCurrentUser);

  const roomFetcher = useCallback((signal: AbortSignal) => api.getRoom(roomId, signal), [roomId]);
  const {
    data: room,
    loading: roomLoading,
    error: roomError,
    refetch: refetchRoom,
  } = useFetch<RoomSummary>(roomFetcher, [roomId]);

  const timezone = room?.office.timezone ?? 'Europe/Moscow';

  const [isoDate, setIsoDate] = useState<string>('');
  useEffect(() => {
    if (!room) return;
    const now = nowInZone(room.office.timezone);
    setIsoDate(
      (current) => current || isoDateFromParts({ year: now.year, month: now.month, day: now.day }),
    );
  }, [room]);

  const range = useMemo(() => {
    if (!isoDate || !room) return null;
    const parts = partsFromIsoDate(isoDate);
    const dayStart = zonedToUtc({ ...parts, hour: 0, minute: 0 }, room.office.timezone);
    const nextDay = addDays(parts, 1);
    const dayEnd = zonedToUtc({ ...nextDay, hour: 0, minute: 0 }, room.office.timezone);
    return { from: dayStart.toISOString(), to: dayEnd.toISOString() };
  }, [isoDate, room]);

  const scheduleFetcher = useCallback(
    (signal: AbortSignal) => {
      if (!range) return Promise.resolve({ items: [] });
      return api.getRoomSchedule(roomId, range, signal);
    },
    [roomId, range],
  );
  const {
    data: schedule,
    loading: scheduleLoading,
    error: scheduleError,
    refetch: refetchSchedule,
  } = useFetch(scheduleFetcher, [roomId, range?.from, range?.to], {
    enabled: Boolean(range),
    keepPreviousData: true,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<Booking | null>(null);

  useEffect(() => {
    if (searchParams.get('compose') === '1') {
      setFormOpen(true);
    }
  }, [searchParams]);

  useRealtimeEvent(
    useCallback(
      (event) => {
        if (!roomId) return;
        if (event.type === 'data.reset') {
          refetchRoom();
          refetchSchedule();
          return;
        }
        if (event.type === 'booking.created' || event.type === 'booking.cancelled') {
          const booking = (event.data as { booking?: Booking }).booking;
          if (booking?.roomId === roomId) refetchSchedule();
        }
        if (event.type === 'room.availability_changed') {
          const data = event.data as { roomId?: string };
          if (data.roomId === roomId) refetchSchedule();
        }
      },
      [refetchRoom, refetchSchedule, roomId],
    ),
  );

  const closeForm = useCallback(() => {
    setFormOpen(false);
    if (searchParams.has('compose')) {
      const next = new URLSearchParams(searchParams);
      next.delete('compose');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (roomLoading && !room) {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-64" />
        <div className="room-detail-layout">
          <LoadingSkeleton className="h-64 w-full" />
          <LoadingSkeleton className="h-[520px] w-full" />
        </div>
      </div>
    );
  }

  if (roomError || !room) {
    return (
      <ErrorState
        title="Не удалось загрузить переговорную"
        description={roomError?.message ?? 'Комната недоступна.'}
        onRetry={() => refetchRoom()}
      />
    );
  }

  const headerDate = (() => {
    const p = partsFromIsoDate(isoDate || '2026-01-01');
    const jsDate = new Date(Date.UTC(p.year, p.month - 1, p.day));
    const weekday = (jsDate.getUTCDay() + 7) % 7;
    return `${formatWeekdayFull(weekday)}, ${formatDateShort({ ...p, weekday })}`;
  })();

  const handleCreated = (booking: Booking) => {
    setFormOpen(false);
    setSuccessToast(booking);
    refetchSchedule();
    if (searchParams.has('compose')) {
      const next = new URLSearchParams(searchParams);
      next.delete('compose');
      setSearchParams(next, { replace: true });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <nav className="breadcrumbs flex flex-wrap items-center gap-2 text-sm text-ink-500">
        <Link to="/rooms" className="hover:text-ink-800">
          Переговорные
        </Link>
        <span>›</span>
        <button type="button" className="hover:text-ink-800" onClick={() => navigate('/rooms')}>
          {room.office.name}
        </button>
        <span>›</span>
        <span className="text-ink-800">Комната «{room.name}»</span>
      </nav>

      <div className="room-detail-layout">
        <RoomInfoCard room={room} />

        <section className="schedule-panel">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-ink-900">Расписание на день</h2>
              <p className="mt-1 text-sm text-ink-500">{headerDate}</p>
            </div>
            <DatePickerPopover
              value={isoDate}
              min={undefined}
              max={undefined}
              onChange={setIsoDate}
              formatLabel={(iso) => {
                const p = partsFromIsoDate(iso);
                const jsDate = new Date(Date.UTC(p.year, p.month - 1, p.day));
                const weekday = (jsDate.getUTCDay() + 7) % 7;
                return formatDateShort({ ...p, weekday });
              }}
              renderTrigger={({ toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 hover:border-ink-300"
                >
                  <CalendarIcon size={16} className="text-ink-400" />
                  <span>Выбрать дату</span>
                </button>
              )}
            />
          </header>

          {scheduleError ? (
            <ErrorState
              title="Не удалось загрузить расписание"
              description={scheduleError.message}
              onRetry={() => refetchSchedule()}
            />
          ) : scheduleLoading && !schedule ? (
            <LoadingSkeleton className="h-[440px] w-full" />
          ) : (
            <ScheduleTimeline
              bookings={schedule?.items ?? []}
              timezone={timezone}
              currentUserId={currentUser?.id ?? null}
            />
          )}

          <div className="flex justify-end">
            <Button size="lg" onClick={() => setFormOpen(true)}>
              Забронировать комнату
            </Button>
          </div>
        </section>
      </div>

      <BookingFormModal
        open={formOpen}
        onClose={closeForm}
        room={room}
        timezone={timezone}
        initialSlot={isoDate ? { isoDate } : undefined}
        onCreated={handleCreated}
      />

      <Toast
        open={Boolean(successToast)}
        onClose={() => setSuccessToast(null)}
        title="Бронирование создано"
        description={
          successToast && `Комната ${successToast.room.name}, ${formatBookingRange(successToast)}`
        }
      />
    </div>
  );
}

function formatBookingRange(booking: Booking): string {
  const tz = booking.office.timezone;
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz,
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const startLabel = parts.format(start);
  const endLabel = new Intl.DateTimeFormat('ru-RU', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
  }).format(end);
  return `${startLabel}—${endLabel}`;
}
