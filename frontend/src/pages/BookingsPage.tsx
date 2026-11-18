import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { ApiError } from '../api/errors';
import type { Booking } from '../api/types';
import { BookingRow } from '../components/bookings/BookingRow';
import { CancelBookingModal } from '../components/bookings/CancelBookingModal';
import { Button } from '../components/ui/Button';
import { CalendarIcon, CheckIcon, ChevronDownIcon } from '../components/ui/Icon';
import { Popover } from '../components/ui/Popover';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/States';
import { Toast } from '../components/ui/Toast';
import { useFetch } from '../hooks/useFetch';
import { useRealtimeEvent } from '../hooks/useRealtimeEvent';
import { useAppSelector } from '../store/hooks';
import { selectOffices } from '../store/selectors';

type Tab = 'upcoming' | 'past';

export function BookingsPage() {
  const offices = useAppSelector(selectOffices);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [officeFilter, setOfficeFilter] = useState<string | null>(null);

  const fetcher = useCallback(
    (signal: AbortSignal) =>
      api.listMyBookings(
        {
          scope: tab,
          officeId: officeFilter ?? undefined,
        },
        signal,
      ),
    [tab, officeFilter],
  );

  const { data, loading, error, refetch } = useFetch(fetcher, [tab, officeFilter], {
    keepPreviousData: true,
  });

  useRealtimeEvent(
    useCallback(
      (event) => {
        if (
          event.type === 'booking.created' ||
          event.type === 'booking.cancelled' ||
          event.type === 'data.reset'
        ) {
          refetch();
        }
      },
      [refetch],
    ),
  );

  const upcomingCountFetcher = useCallback(
    (signal: AbortSignal) =>
      api.listMyBookings({ scope: 'upcoming', officeId: officeFilter ?? undefined }, signal),
    [officeFilter],
  );
  const { data: upcomingData } = useFetch(upcomingCountFetcher, [officeFilter], {
    keepPreviousData: true,
  });

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error';
    title: string;
    description?: string;
  } | null>(null);

  const closeCancel = () => {
    if (cancelling) return;
    setCancelTarget(null);
  };

  const confirmCancel = async (booking: Booking) => {
    setCancelling(true);
    try {
      await api.cancelBooking(booking.id);
      setCancelTarget(null);
      refetch();
      setFeedback({
        kind: 'success',
        title: 'Бронирование отменено',
        description: `${booking.title}, ${booking.room.name}`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Не удалось отменить бронирование';
      setFeedback({ kind: 'error', title: 'Ошибка отмены', description: message });
    } finally {
      setCancelling(false);
    }
  };

  const officeLabel = useMemo(() => {
    if (!officeFilter) return 'Все офисы';
    return offices.find((o) => o.id === officeFilter)?.name ?? 'Все офисы';
  }, [officeFilter, offices]);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-3xl font-bold text-ink-900">Мои бронирования</h1>
        <div className="flex items-center gap-3">
          <Popover
            align="right"
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800 hover:border-ink-300"
              >
                <span>{officeLabel}</span>
                <ChevronDownIcon size={16} className="text-ink-400" />
              </button>
            )}
          >
            {(close) => (
              <ul className="max-h-72 w-56 overflow-y-auto py-1 text-sm">
                <li>
                  <button
                    type="button"
                    className={[
                      'flex w-full items-center justify-between px-3 py-1.5 text-left',
                      officeFilter === null
                        ? 'font-semibold text-brand-600'
                        : 'text-ink-800 hover:bg-brand-50',
                    ].join(' ')}
                    onClick={() => {
                      setOfficeFilter(null);
                      close();
                    }}
                  >
                    <span>Все офисы</span>
                    {officeFilter === null && <CheckIcon size={14} />}
                  </button>
                </li>
                {offices.map((office) => (
                  <li key={office.id}>
                    <button
                      type="button"
                      className={[
                        'flex w-full items-center justify-between px-3 py-1.5 text-left',
                        officeFilter === office.id
                          ? 'font-semibold text-brand-600'
                          : 'text-ink-800 hover:bg-brand-50',
                      ].join(' ')}
                      onClick={() => {
                        setOfficeFilter(office.id);
                        close();
                      }}
                    >
                      <span>{office.name}</span>
                      {officeFilter === office.id && <CheckIcon size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Popover>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-800"
            aria-label="Диапазон дат"
            title="Фильтр по датам появится позже"
          >
            <CalendarIcon size={16} className="text-ink-400" />
            <span>За все время</span>
          </button>
        </div>
      </header>

      <nav className="flex gap-8 border-b border-ink-200 text-sm font-medium">
        <TabButton active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
          Предстоящие ({upcomingData?.items.length ?? 0})
        </TabButton>
        <TabButton active={tab === 'past'} onClick={() => setTab('past')}>
          Прошедшие
        </TabButton>
      </nav>

      <BookingsList
        loading={loading}
        error={error}
        onRetry={refetch}
        bookings={data?.items ?? []}
        tab={tab}
        onCancel={setCancelTarget}
      />

      <CancelBookingModal
        open={Boolean(cancelTarget)}
        onClose={closeCancel}
        booking={cancelTarget}
        submitting={cancelling}
        onConfirm={confirmCancel}
      />

      <Toast
        open={Boolean(feedback)}
        onClose={() => setFeedback(null)}
        title={feedback?.title ?? ''}
        description={feedback?.description}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative pb-3 pt-1 transition',
        active ? 'text-brand-600' : 'text-ink-500 hover:text-ink-800',
      ].join(' ')}
    >
      {children}
      {active && (
        <span className="absolute -bottom-px left-0 right-0 h-[3px] rounded-t bg-brand-500" />
      )}
    </button>
  );
}

interface BookingsListProps {
  loading: boolean;
  error: Error | null;
  bookings: Booking[];
  tab: Tab;
  onRetry: () => void;
  onCancel: (booking: Booking) => void;
}

function BookingsList({ loading, error, bookings, tab, onRetry, onCancel }: BookingsListProps) {
  if (loading && bookings.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((idx) => (
          <LoadingSkeleton key={idx} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Не удалось загрузить бронирования"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        title={tab === 'upcoming' ? 'Пока нет бронирований' : 'Прошедших бронирований нет'}
        description={
          tab === 'upcoming'
            ? 'Забронируйте переговорную на нужное время.'
            : 'Здесь появятся ваши прошедшие бронирования.'
        }
        action={
          tab === 'upcoming' ? (
            <Link to="/rooms">
              <Button>Выбрать переговорную</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {bookings.map((booking) => (
        <BookingRow
          key={booking.id}
          booking={booking}
          showCancel={tab === 'upcoming'}
          onCancel={tab === 'upcoming' ? onCancel : undefined}
        />
      ))}
    </div>
  );
}
