import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  compareDateParts,
  formatMonthName,
  isoDateFromParts,
  partsFromIsoDate,
} from '../../lib/datetime';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '../ui/Icon';
import { Popover } from '../ui/Popover';

interface DatePickerProps {
  value: string;
  min?: string;
  max?: string;
  onChange: (isoDate: string) => void;
  renderTrigger?: (state: { toggle: () => void; open: boolean; label: string }) => ReactNode;
  formatLabel: (isoDate: string) => string;
  align?: 'left' | 'right';
}

interface CalendarMonth {
  year: number;
  month: number;
}

function toMonth(iso: string): CalendarMonth {
  if (!iso) {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  }
  const parts = partsFromIsoDate(iso);
  return { year: parts.year, month: parts.month };
}

function monthGrid({ year, month }: CalendarMonth) {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = (firstOfMonth.getUTCDay() + 6) % 7; // понедельник = 0
  const firstVisible = new Date(firstOfMonth);
  firstVisible.setUTCDate(firstOfMonth.getUTCDate() - firstWeekday);

  const cells: {
    year: number;
    month: number;
    day: number;
    inCurrentMonth: boolean;
  }[] = [];
  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstVisible);
    date.setUTCDate(firstVisible.getUTCDate() + index);
    cells.push({
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      day: date.getUTCDate(),
      inCurrentMonth: date.getUTCMonth() + 1 === month && date.getUTCFullYear() === year,
    });
  }
  return cells;
}

const WEEKDAY_HEADER = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function DatePickerPopover({
  value,
  min,
  max,
  onChange,
  renderTrigger,
  formatLabel,
  align = 'left',
}: DatePickerProps) {
  const [displayed, setDisplayed] = useState<CalendarMonth>(() => toMonth(value));
  // Дата комнаты приходит после загрузки API. Обновляем месяц, когда она появилась.
  useEffect(() => {
    if (value) setDisplayed(toMonth(value));
  }, [value]);

  const cells = useMemo(() => monthGrid(displayed), [displayed]);
  const minParts = min ? partsFromIsoDate(min) : null;
  const maxParts = max ? partsFromIsoDate(max) : null;
  const selectedParts = partsFromIsoDate(value);

  const label = formatLabel(value);

  const shift = (delta: number) => {
    const next = new Date(Date.UTC(displayed.year, displayed.month - 1 + delta, 1));
    setDisplayed({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 });
  };

  return (
    <Popover
      align={align}
      trigger={({ toggle, open }) =>
        renderTrigger ? (
          renderTrigger({ toggle, open, label })
        ) : (
          <button
            type="button"
            className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-900 hover:border-ink-300"
            onClick={toggle}
          >
            <CalendarIcon size={16} className="text-ink-400" />
            <span>{label}</span>
          </button>
        )
      }
    >
      {(close) => (
        <div className="w-72 p-3">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="rounded p-1 text-ink-500 hover:bg-ink-100"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeftIcon size={18} />
            </button>
            <div className="text-sm font-semibold text-ink-900">
              {formatMonthName(displayed.month)} {displayed.year}
            </div>
            <button
              type="button"
              onClick={() => shift(1)}
              className="rounded p-1 text-ink-500 hover:bg-ink-100"
              aria-label="Следующий месяц"
            >
              <ChevronRightIcon size={18} />
            </button>
          </div>
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-medium text-ink-400">
            {WEEKDAY_HEADER.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {cells.map((cell) => {
              const cellParts = { year: cell.year, month: cell.month, day: cell.day };
              const isSelected = compareDateParts(cellParts, selectedParts) === 0;
              const isBeforeMin = minParts && compareDateParts(cellParts, minParts) < 0;
              const isAfterMax = maxParts && compareDateParts(cellParts, maxParts) > 0;
              const disabled = Boolean(isBeforeMin) || Boolean(isAfterMax);
              return (
                <button
                  key={`${cell.year}-${cell.month}-${cell.day}`}
                  type="button"
                  disabled={disabled}
                  className={[
                    'h-9 rounded-lg text-center',
                    isSelected
                      ? 'bg-brand-500 text-white font-semibold'
                      : cell.inCurrentMonth
                        ? 'text-ink-800 hover:bg-brand-50'
                        : 'text-ink-300 hover:bg-brand-50',
                    disabled ? 'opacity-40 hover:bg-transparent cursor-not-allowed' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    onChange(isoDateFromParts(cellParts));
                    close();
                  }}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] text-ink-500">
            Ограничение до не более 30 дней вперёд. Даты за пределами лимита неактивны.
          </p>
        </div>
      )}
    </Popover>
  );
}
