import { CalendarIcon, ChevronDownIcon, ClockIcon, UsersIcon } from '../ui/Icon';
import { Field } from '../ui/Field';
import { DatePickerPopover } from './DatePickerPopover';
import { TimePickerPopover } from './TimePickerPopover';
import { DurationPicker } from './DurationPicker';
import { CapacityPicker } from './CapacityPicker';
import {
  CAPACITY_OPTIONS,
  DEFAULT_DURATION_OPTIONS,
  computeMaxIsoDate,
  computeMinIsoDate,
  maxDurationForStart,
} from '../../lib/bookingSlots';
import { formatDateShort, formatHm, partsFromIsoDate } from '../../lib/datetime';

interface RoomFiltersProps {
  timezone: string;
  disabled?: boolean;
  isoDate: string;
  startTime: string;
  durationMinutes: number;
  minCapacity: number | null;
  onDateChange: (isoDate: string) => void;
  onStartTimeChange: (value: string) => void;
  onDurationChange: (minutes: number) => void;
  onCapacityChange: (value: number | null) => void;
}

function formatDateLabel(iso: string): string {
  const p = partsFromIsoDate(iso);
  const jsDate = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const weekday = (jsDate.getUTCDay() + 7) % 7;
  return formatDateShort({ ...p, weekday });
}

export function RoomFilters({
  timezone,
  disabled,
  isoDate,
  startTime,
  durationMinutes,
  minCapacity,
  onDateChange,
  onStartTimeChange,
  onDurationChange,
  onCapacityChange,
}: RoomFiltersProps) {
  const min = computeMinIsoDate(timezone);
  const max = computeMaxIsoDate(timezone);
  const maxDuration = maxDurationForStart(startTime);
  const availableDurations = DEFAULT_DURATION_OPTIONS.filter((minutes) => minutes <= maxDuration);
  const disabledClass = disabled ? 'opacity-60 pointer-events-none' : '';

  return (
    <div className={`filter-fields ${disabledClass}`}>
      <Field label="Дата">
        <DatePickerPopover
          value={isoDate}
          min={min}
          max={max}
          onChange={onDateChange}
          formatLabel={formatDateLabel}
          renderTrigger={({ toggle, label }) => (
            <button
              type="button"
              disabled={disabled}
              className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 hover:border-ink-300"
              onClick={toggle}
            >
              <CalendarIcon size={16} className="text-ink-400" />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )}
        />
      </Field>

      <Field label="Время начала">
        <TimePickerPopover
          value={startTime}
          onChange={onStartTimeChange}
          renderTrigger={({ toggle, label }) => (
            <button
              type="button"
              disabled={disabled}
              className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 hover:border-ink-300"
              onClick={toggle}
            >
              <ClockIcon size={16} className="text-ink-400" />
              <span className="flex-1 text-left">{formatHm(parseHm(label))}</span>
            </button>
          )}
        />
      </Field>

      <Field label="Длительность">
        <DurationPicker
          value={Math.min(durationMinutes, maxDuration)}
          onChange={onDurationChange}
          options={availableDurations}
          renderTrigger={({ toggle, label }) => (
            <button
              type="button"
              disabled={disabled}
              onClick={toggle}
              className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 hover:border-ink-300"
            >
              <span className="flex-1 text-left">{label}</span>
              <ChevronDownIcon size={16} className="text-ink-400" />
            </button>
          )}
        />
      </Field>

      <Field label="Вместимость">
        <CapacityPicker
          value={minCapacity}
          onChange={onCapacityChange}
          options={CAPACITY_OPTIONS}
          renderTrigger={({ toggle, label }) => (
            <button
              type="button"
              disabled={disabled}
              onClick={toggle}
              className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 hover:border-ink-300"
            >
              <UsersIcon size={16} className="text-ink-400" />
              <span className="flex-1 text-left">{label}</span>
            </button>
          )}
        />
      </Field>
    </div>
  );
}

function parseHm(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return { hour: h ?? 0, minute: m ?? 0 };
}
