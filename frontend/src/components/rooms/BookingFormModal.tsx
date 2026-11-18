import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { ApiError } from '../../api/errors';
import type { Booking, RoomSummary } from '../../api/types';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { AlertIcon, CalendarIcon, CheckIcon, ClockIcon } from '../ui/Icon';
import { Modal } from '../ui/Modal';
import { DatePickerPopover } from './DatePickerPopover';
import { TimePickerPopover } from './TimePickerPopover';
import { DurationPicker } from './DurationPicker';
import {
  DEFAULT_DURATION_OPTIONS,
  buildDefaultSlot,
  computeMaxIsoDate,
  computeMinIsoDate,
  isSlotInFuture,
  isSlotWithinAdvanceLimit,
  maxDurationForStart,
  slotToInterval,
  type FilterSlot,
} from '../../lib/bookingSlots';
import {
  MAX_ADVANCE_DAYS,
  formatDateShort,
  formatHm,
  minutesToLabel,
  partsFromIsoDate,
  partsFromMinutes,
} from '../../lib/datetime';

interface BookingFormModalProps {
  open: boolean;
  onClose: () => void;
  room: RoomSummary;
  timezone: string;
  initialSlot?: Partial<FilterSlot>;
  onCreated: (booking: Booking) => void;
}

interface FormErrors {
  title?: string;
  date?: string;
  startTime?: string;
  duration?: string;
}

function toDateLabel(iso: string): string {
  const p = partsFromIsoDate(iso);
  const jsDate = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const weekday = (jsDate.getUTCDay() + 7) % 7;
  return formatDateShort({ ...p, weekday });
}

export function BookingFormModal({
  open,
  onClose,
  room,
  timezone,
  initialSlot,
  onCreated,
}: BookingFormModalProps) {
  const [slot, setSlot] = useState<FilterSlot>(() => {
    const base = buildDefaultSlot(timezone);
    return { ...base, ...initialSlot };
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    const base = buildDefaultSlot(timezone);
    setSlot({ ...base, ...initialSlot });
    setTitle('');
    setComment('');
    setErrors({});
    setConflict(null);
    setServerError(null);
    setTouched(false);
  }, [open, timezone, initialSlot?.isoDate, initialSlot?.startTime, initialSlot?.durationMinutes]);

  const maxDuration = maxDurationForStart(slot.startTime);
  const durationOptions = useMemo(
    () => DEFAULT_DURATION_OPTIONS.filter((minutes) => minutes <= maxDuration),
    [maxDuration],
  );

  const interval = useMemo(() => slotToInterval(slot, timezone), [slot, timezone]);

  const previewLabel = (() => {
    const dateLabel = toDateLabel(slot.isoDate);
    const startLabel = slot.startTime;
    const endParts = partsFromMinutes(parseTime(slot.startTime).minutes + slot.durationMinutes);
    return `Бронирование на ${dateLabel}, ${startLabel} до ${formatHm(endParts)} (${minutesToLabel(slot.durationMinutes)})`;
  })();

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};
    if (!title.trim()) nextErrors.title = 'Обязательное поле';
    if (!isSlotWithinAdvanceLimit(slot, timezone)) {
      nextErrors.date = `Максимум ${MAX_ADVANCE_DAYS} дней вперёд`;
    }
    if (!isSlotInFuture(slot, timezone)) {
      nextErrors.startTime = 'Нельзя создать бронирование в прошлом';
    }
    if (slot.durationMinutes > maxDuration) {
      nextErrors.duration = 'Длительность выходит за рабочие часы';
    }
    return nextErrors;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    setConflict(null);
    setServerError(null);
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const booking = await api.createBooking({
        roomId: room.id,
        title: title.trim(),
        comment: comment.trim() ? comment.trim() : null,
        startsAt: interval.startsAt.toISOString(),
        endsAt: interval.endsAt.toISOString(),
      });
      onCreated(booking);
    } catch (error) {
      if (error instanceof ApiError && error.isConflict) {
        setConflict(error.message);
      } else if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError('Не удалось создать бронирование');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const errorsToShow = touched ? errors : {};
  const minDate = computeMinIsoDate(timezone);
  const maxDate = computeMaxIsoDate(timezone);

  if (conflict) {
    return (
      <Modal open={open} onClose={onClose} size="sm" ariaLabel="Конфликт бронирования">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger-500">
            <AlertIcon size={28} />
          </div>
          <h3 className="text-lg font-semibold text-ink-900">Время уже занято</h3>
          <p className="text-sm text-ink-500">
            Выбранный интервал был забронирован другим сотрудником. Расписание обновлено.
          </p>
          <Button block onClick={() => setConflict(null)}>
            Выбрать другое время
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое бронирование"
      ariaLabel="Новое бронирование"
      footer={
        <form className="flex justify-end gap-3" onSubmit={submit}>
          <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
            Отмена
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Сохраняем…' : 'Забронировать'}
          </Button>
        </form>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={(event) => event.preventDefault()} noValidate>
        <p className="text-sm text-ink-500">
          Переговорная: <span className="font-semibold text-brand-600">{room.name}</span>{' '}
          <span className="text-ink-500">
            ({room.office.name}, {room.floor} этаж)
          </span>
        </p>

        <Field
          label={
            <span>
              Тема встречи <span className="text-danger-600">*</span>
            </span>
          }
          error={errorsToShow.title}
        >
          <input
            className={inputClass(Boolean(errorsToShow.title))}
            placeholder="Укажите тему встречи"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Дата" error={errorsToShow.date}>
            <DatePickerPopover
              value={slot.isoDate}
              min={minDate}
              max={maxDate}
              onChange={(isoDate) => setSlot((current) => ({ ...current, isoDate }))}
              formatLabel={toDateLabel}
              renderTrigger={({ toggle, label }) => (
                <button
                  type="button"
                  className={triggerClass(Boolean(errorsToShow.date))}
                  onClick={toggle}
                >
                  <CalendarIcon size={16} className="text-ink-400" />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              )}
            />
          </Field>
          <Field label="Время начала" error={errorsToShow.startTime}>
            <TimePickerPopover
              value={slot.startTime}
              onChange={(startTime) => setSlot((current) => ({ ...current, startTime }))}
              renderTrigger={({ toggle, label }) => (
                <button
                  type="button"
                  className={triggerClass(Boolean(errorsToShow.startTime))}
                  onClick={toggle}
                >
                  <ClockIcon size={16} className="text-ink-400" />
                  <span className="flex-1 text-left">{label}</span>
                </button>
              )}
            />
          </Field>
        </div>

        <Field label="Продолжительность" error={errorsToShow.duration}>
          <DurationPicker
            value={Math.min(slot.durationMinutes, maxDuration)}
            options={durationOptions}
            onChange={(durationMinutes) =>
              setSlot((current) => ({ ...current, durationMinutes }))
            }
            renderTrigger={({ toggle, label }) => (
              <button
                type="button"
                className={triggerClass(Boolean(errorsToShow.duration), true)}
                onClick={toggle}
              >
                <span className="flex-1 text-left">
                  {label} (до{' '}
                  {formatHm(
                    partsFromMinutes(parseTime(slot.startTime).minutes + slot.durationMinutes),
                  )}
                  )
                </span>
              </button>
            )}
          />
        </Field>

        <Field label="Комментарий">
          <textarea
            className={inputClass(false, 'min-h-[70px]')}
            placeholder="Дополнительная информация для участников встречи…"
            value={comment}
            maxLength={2000}
            onChange={(event) => setComment(event.target.value)}
          />
        </Field>

        <div className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <span className="inline-flex items-center gap-2">
            <CheckIcon size={16} className="text-brand-500" />
            {previewLabel}
          </span>
        </div>

        {serverError && (
          <div className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {serverError}
          </div>
        )}
      </form>
    </Modal>
  );
}

function inputClass(hasError: boolean, extra?: string): string {
  return [
    'w-full rounded-lg border px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400',
    'focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400',
    hasError ? 'border-danger-500 bg-danger-50/40' : 'border-ink-200 bg-white hover:border-ink-300',
    extra ?? '',
  ]
    .filter(Boolean)
    .join(' ');
}

function triggerClass(hasError: boolean, _withChevron = false): string {
  return [
    'inline-flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-ink-900',
    hasError ? 'border-danger-500 bg-danger-50/40' : 'border-ink-200 bg-white hover:border-ink-300',
  ].join(' ');
}

function parseTime(value: string): { hour: number; minute: number; minutes: number } {
  const [hour, minute] = value.split(':').map(Number);
  return { hour, minute, minutes: hour * 60 + minute };
}
