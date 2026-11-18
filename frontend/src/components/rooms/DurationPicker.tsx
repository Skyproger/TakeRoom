import type { ReactNode } from 'react';
import { CheckIcon, ChevronDownIcon } from '../ui/Icon';
import { Popover } from '../ui/Popover';
import { minutesToLabel } from '../../lib/datetime';

interface DurationPickerProps {
  value: number;
  onChange: (minutes: number) => void;
  options: number[];
  disabledOption?: (minutes: number) => boolean;
  renderTrigger?: (state: { toggle: () => void; open: boolean; label: string }) => ReactNode;
  align?: 'left' | 'right';
}

export function DurationPicker({
  value,
  onChange,
  options,
  disabledOption,
  renderTrigger,
  align = 'left',
}: DurationPickerProps) {
  const label = minutesToLabel(value);

  return (
    <Popover
      align={align}
      trigger={({ toggle, open }) =>
        renderTrigger ? (
          renderTrigger({ toggle, open, label })
        ) : (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 hover:border-ink-300"
          >
            <span>{label}</span>
            <ChevronDownIcon size={16} className="text-ink-400" />
          </button>
        )
      }
    >
      {(close) => (
        <ul className="max-h-72 w-36 overflow-y-auto py-1 text-sm">
          {options.map((minutes) => {
            const isDisabled = disabledOption?.(minutes) ?? false;
            const isSelected = minutes === value;
            return (
              <li key={minutes}>
                <button
                  type="button"
                  disabled={isDisabled}
                  className={[
                    'flex w-full items-center justify-between px-3 py-1.5 text-left',
                    isDisabled ? 'text-ink-300 cursor-not-allowed' : 'text-ink-800 hover:bg-brand-50',
                    isSelected ? 'font-semibold text-brand-600' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => {
                    onChange(minutes);
                    close();
                  }}
                >
                  <span>{minutesToLabel(minutes)}</span>
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
