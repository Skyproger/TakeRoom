import type { Booking } from '../../api/types';
import { Button } from '../ui/Button';
import { BuildingIcon, CalendarIcon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { formatWeekdayFull, pad2, toZonedParts } from '../../lib/datetime';

interface CancelBookingModalProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: (booking: Booking) => void;
  submitting?: boolean;
}

export function CancelBookingModal({
  open,
  onClose,
  booking,
  onConfirm,
  submitting,
}: CancelBookingModalProps) {
  if (!booking) return null;
  const tz = booking.office.timezone;
  const start = toZonedParts(booking.startsAt, tz);
  const end = toZonedParts(booking.endsAt, tz);
  const jsDate = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const weekday = (jsDate.getUTCDay() + 7) % 7;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Отменить бронирование?"
      ariaLabel="Подтверждение отмены"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Нет, оставить
          </Button>
          <Button variant="danger" onClick={() => onConfirm(booking)} disabled={submitting}>
            {submitting ? 'Отменяем…' : 'Да, отменить'}
          </Button>
        </div>
      }
    >
      <p className="text-sm text-ink-500">
        Это действие нельзя будет отменить. Освободившееся время станет доступно другим сотрудникам.
      </p>
      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
        <span className="font-semibold text-ink-900">{booking.title}</span>
        <span className="inline-flex items-center gap-2">
          <BuildingIcon size={14} className="text-ink-400" /> Комната «{booking.room.name}»,{' '}
          {booking.room.floor} этаж
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarIcon size={14} className="text-ink-400" /> {formatWeekdayFull(weekday)},{' '}
          {start.day} {monthGenitive(start.month)}, {pad2(start.hour)}:{pad2(start.minute)} до{' '}
          {pad2(end.hour)}:{pad2(end.minute)}
        </span>
      </div>
    </Modal>
  );
}

function monthGenitive(index: number): string {
  const months = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  return months[index - 1] ?? '';
}
