import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectOffice } from '../../store/appSlice';
import { selectOffices, selectSelectedOffice } from '../../store/selectors';
import { CheckIcon, ChevronDownIcon } from '../ui/Icon';
import { Popover } from '../ui/Popover';
import { nowInZone, pad2, shortTimezone } from '../../lib/datetime';

export function OfficePicker() {
  const offices = useAppSelector(selectOffices);
  const selectedOffice = useAppSelector(selectSelectedOffice);
  const dispatch = useAppDispatch();

  const currentLabel = selectedOffice?.name ?? 'Выберите офис';

  const timeLabel = selectedOffice
    ? `Местное время: ${(() => {
        const parts = nowInZone(selectedOffice.timezone);
        return `${pad2(parts.hour)}:${pad2(parts.minute)} ${shortTimezone(selectedOffice.timezone)}`;
      })()}`
    : 'Местное время: —';

  return (
    <div className="office-picker">
      <Popover
        trigger={({ toggle, open }) => (
          <button
            type="button"
            className="office-trigger"
            onClick={toggle}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className={selectedOffice ? '' : 'text-ink-600'}>{currentLabel}</span>
            <ChevronDownIcon size={22} className="text-ink-400" />
          </button>
        )}
      >
        {(close) => (
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {offices.map((office) => {
              const active = office.id === selectedOffice?.id;
              return (
                <li key={office.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className="flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left hover:bg-ink-50"
                    onClick={() => {
                      dispatch(selectOffice(office.id));
                      close();
                    }}
                  >
                    <span className="mt-0.5 h-5 w-5 shrink-0 text-brand-500">
                      {active ? <CheckIcon size={18} /> : null}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-medium text-ink-900">{office.name}</span>
                      <span className="text-xs text-ink-500">{office.address}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Popover>
      <div className="office-meta">
        <span>{selectedOffice?.address ?? 'Адрес не выбран'}</span>
        <span>{timeLabel}</span>
      </div>
    </div>
  );
}
