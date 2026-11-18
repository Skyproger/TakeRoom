import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Office, RoomSummary } from '../api/types';
import { OfficePicker } from '../components/rooms/OfficePicker';
import { RoomCard } from '../components/rooms/RoomCard';
import { RoomFilters } from '../components/rooms/RoomFilters';
import { EmptyState, ErrorState, LoadingSkeleton } from '../components/ui/States';
import { useFetch } from '../hooks/useFetch';
import { useRealtimeEvent } from '../hooks/useRealtimeEvent';
import { buildDefaultSlot, slotToInterval, type FilterSlot } from '../lib/bookingSlots';
import { selectOffice } from '../store/appSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectAppError,
  selectAppStatus,
  selectOffices,
  selectSelectedOffice,
} from '../store/selectors';

export function RoomsPage() {
  const offices = useAppSelector(selectOffices);
  const selectedOffice = useAppSelector(selectSelectedOffice);
  const appStatus = useAppSelector(selectAppStatus);
  const appError = useAppSelector(selectAppError);
  const dispatch = useAppDispatch();

  const [slot, setSlot] = useState<FilterSlot>(() => buildDefaultSlot('Europe/Moscow'));
  const [slotCustomized, setSlotCustomized] = useState(false);
  const [minCapacity, setMinCapacity] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedOffice || slotCustomized) return;
    setSlot(buildDefaultSlot(selectedOffice.timezone));
  }, [selectedOffice, slotCustomized]);

  useEffect(() => {
    if (!selectedOffice && offices.length === 1) {
      dispatch(selectOffice(offices[0].id));
    }
  }, [offices, selectedOffice, dispatch]);

  const interval = useMemo(() => {
    if (!selectedOffice) return null;
    return slotToInterval(slot, selectedOffice.timezone);
  }, [selectedOffice, slot]);

  const fetchRooms = useCallback(
    (signal: AbortSignal) => {
      if (!selectedOffice || !interval) return Promise.resolve({ items: [] });
      return api.listRooms(
        {
          officeId: selectedOffice.id,
          minCapacity: minCapacity ?? undefined,
          from: interval.startsAt.toISOString(),
          to: interval.endsAt.toISOString(),
        },
        signal,
      );
    },
    [selectedOffice, interval, minCapacity],
  );

  const {
    data: roomsResponse,
    loading: roomsLoading,
    error: roomsError,
    refetch,
  } = useFetch(
    fetchRooms,
    [selectedOffice?.id, interval?.startsAt.getTime(), interval?.endsAt.getTime(), minCapacity],
    {
      enabled: Boolean(selectedOffice && interval),
      keepPreviousData: true,
    },
  );

  useRealtimeEvent(
    useCallback(
      (event) => {
        if (!selectedOffice) return;
        if (event.type === 'room.availability_changed' || event.type === 'data.reset') {
          refetch();
        }
      },
      [refetch, selectedOffice],
    ),
  );

  if (appStatus === 'loading' || appStatus === 'idle') {
    return (
      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-8 w-64" />
        <LoadingSkeleton className="h-24 w-full" />
        <div className="room-list">
          {[0, 1, 2, 3].map((idx) => (
            <LoadingSkeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (appStatus === 'error') {
    return (
      <ErrorState
        title="Не удалось загрузить офисы"
        description={appError ?? 'Неизвестная ошибка'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const handleBook = (room: RoomSummary) => {
    navigate(`/rooms/${encodeURIComponent(room.id)}?compose=1`);
  };

  return (
    <div className="rooms-page">
      <header className="page-heading">
        <h1>Переговорные</h1>
        <OfficePicker />
      </header>

      <section className="filter-bar">
        <RoomFilters
          timezone={selectedOffice?.timezone ?? 'Europe/Moscow'}
          disabled={!selectedOffice}
          isoDate={slot.isoDate}
          startTime={slot.startTime}
          durationMinutes={slot.durationMinutes}
          minCapacity={minCapacity}
          onDateChange={(isoDate) => {
            setSlotCustomized(true);
            setSlot((current) => ({ ...current, isoDate }));
          }}
          onStartTimeChange={(startTime) => {
            setSlotCustomized(true);
            setSlot((current) => ({ ...current, startTime }));
          }}
          onDurationChange={(durationMinutes) => {
            setSlotCustomized(true);
            setSlot((current) => ({ ...current, durationMinutes }));
          }}
          onCapacityChange={setMinCapacity}
        />
      </section>

      <RoomsContent
        selectedOffice={selectedOffice}
        rooms={roomsResponse?.items ?? []}
        loading={roomsLoading}
        error={roomsError}
        filterEnabled={Boolean(selectedOffice)}
        onRetry={refetch}
        onBook={handleBook}
      />
    </div>
  );
}

interface RoomsContentProps {
  selectedOffice: Office | null;
  rooms: RoomSummary[];
  loading: boolean;
  error: Error | null;
  filterEnabled: boolean;
  onRetry: () => void;
  onBook: (room: RoomSummary) => void;
}

function RoomsContent({
  selectedOffice,
  rooms,
  loading,
  error,
  filterEnabled,
  onRetry,
  onBook,
}: RoomsContentProps) {
  if (!selectedOffice) {
    return (
      <EmptyState
        title="Выберите офис"
        description={'Для просмотра доступных переговорных сначала выберите офис\nиз списка выше'}
      />
    );
  }

  if (loading && rooms.length === 0) {
    return (
      <div className="room-list">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <LoadingSkeleton key={idx} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Не удалось загрузить переговорные"
        description={error.message}
        onRetry={onRetry}
      />
    );
  }

  if (rooms.length === 0) {
    return (
      <EmptyState
        title="В этом офисе нет переговорных"
        description="Попробуйте выбрать другой офис или изменить фильтры."
      />
    );
  }

  return (
    <section>
      <h2 className="list-heading">Переговорные в этом офисе</h2>
      <div className="room-list">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            timezone={selectedOffice.timezone}
            filterEnabled={filterEnabled}
            onBook={onBook}
          />
        ))}
      </div>
    </section>
  );
}
