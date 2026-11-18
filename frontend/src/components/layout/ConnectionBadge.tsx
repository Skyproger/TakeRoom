import { useAppSelector } from '../../store/hooks';
import { selectRealtimeStatus } from '../../store/selectors';

const LABELS = {
  connecting: 'Подключение…',
  open: 'Онлайн',
  closed: 'Нет соединения',
} as const;

const STYLES = {
  connecting: 'bg-amber-50 text-amber-700 border-amber-200',
  open: 'bg-brand-50 text-brand-700 border-brand-100',
  closed: 'bg-danger-50 text-danger-600 border-danger-100',
} as const;

export function ConnectionBadge() {
  const status = useAppSelector(selectRealtimeStatus);
  if (status === 'open') {
    return null;
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STYLES[status]}`}
      aria-live="polite"
    >
      {LABELS[status]}
    </span>
  );
}
