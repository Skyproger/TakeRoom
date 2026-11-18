import type { ReactNode } from 'react';
import { CheckIcon, ClockIcon } from '../ui/Icon';
import { Popover } from '../ui/Popover';
import {
  MINUTES_STEP,
  WORK_END_MINUTES,
  WORK_START_MINUTES,
  formatHm,
  minutesFromParts,
  partsFromMinutes,
} from '../../lib/datetime';

interface TimePickerProps {
  value: string; // 'HH:mm'
  onChange: (value: string) => void;
  minMinutes?: number;
  maxMinutes?: number;
  renderTrigger?: (state: { toggle: () => void; open: boolean; label: string }) => ReactNode;
  align?: 'left' | 'right';
}

function parse(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return { hour: h, minute: m };
}

export function TimePickerPopover({
  value,
  onChange,
  minMinutes = WORK_START_MINUTES,
  maxMinutes = WORK_END_MINUTES - MINUTES_STEP,
  renderTrigger,
  align = 'left',
}: TimePickerProps) {
  const slots: string[] = [];
  for (let m = WORK_START_MINUTES; m <= WORK_END_MINUTES - MINUTES_STEP; m += MINUTES_STEP) {
    slots.push(formatHm(partsFromMinutes(m)));
  }

  const selectedMinutes = minutesFromParts(parse(value));

  return (
    <Popover
      align={align}
      trigger={({ toggle, open }) =>
        renderTrigger ? (
          renderTrigger({ toggle, open, label: value })
        ) : (
          <button
            type="button"
            className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-900 hover:border-ink-300"
            onClick={toggle}
          >
            <ClockIcon size={16} className="text-ink-400" />
            <span>{value || '--:--'}</span>
          </button>
        )
      }
    >
      {(close) => (
        <ul className="max-h-72 w-32 overflow-y-auto py-1 text-sm">
          {slots.map((slot) => {
            const slotMinutes = minutesFromParts(parse(slot));
            const disabled = slotMinutes < minMinutes || slotMinutes > maxMinutes;
            const isSelected = slotMinutes === selectedMinutes;
            return (
              <li key={slot}>
                <button
                  type="button"
                  disabled={disabled}
                  className={[
                    'flex w-full items-center justify-between px-3 py-1.5 text-left',
                    disabled
                      ? 'text-ink-300 cursor-not-allowed'
                      : 'text-ink-800 hover:bg-brand-50',
                    isSelected ? 'font-semibold text-brand-600' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    onChange(slot);
                    close();
                  }}
                >
                  <span>{slot}</span>
                  {isSelected && <CheckIcon size={14} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Popover>
  );
}
