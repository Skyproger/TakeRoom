import type { ReactNode } from 'react';
import { CheckIcon } from '../ui/Icon';
import { Popover } from '../ui/Popover';
import { UsersIcon } from '../ui/Icon';

interface CapacityPickerProps {
  value: number | null;
  onChange: (value: number | null) => void;
  options: number[];
  renderTrigger?: (state: { toggle: () => void; open: boolean; label: string }) => ReactNode;
  align?: 'left' | 'right';
}

export function CapacityPicker({
  value,
  onChange,
  options,
  renderTrigger,
  align = 'left',
}: CapacityPickerProps) {
  const label = value ? `Мин. ${value} чел.` : 'Не указано';

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
            className="inline-flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm text-ink-900 hover:border-ink-300"
          >
            <UsersIcon size={16} className="text-ink-400" />
            <span>{label}</span>
          </button>
        )
      }
    >
      {(close) => (
        <ul className="max-h-72 w-40 overflow-y-auto py-1 text-sm">
          <li>
            <button
              type="button"
              className={[
                'flex w-full items-center justify-between px-3 py-1.5 text-left',
                value === null ? 'font-semibold text-brand-600' : 'text-ink-800 hover:bg-brand-50',
              ].join(' ')}
              onClick={() => {
                onChange(null);
                close();
              }}
            >
              <span>Любая</span>
              {value === null && <CheckIcon size={14} />}
            </button>
          </li>
          {options.map((count) => (
            <li key={count}>
              <button
                type="button"
                className={[
                  'flex w-full items-center justify-between px-3 py-1.5 text-left',
                  value === count
                    ? 'font-semibold text-brand-600'
                    : 'text-ink-800 hover:bg-brand-50',
                ].join(' ')}
                onClick={() => {
                  onChange(count);
                  close();
                }}
              >
                <span>{count} чел.</span>
                {value === count && <CheckIcon size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Popover>
  );
}
