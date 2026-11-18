import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { CheckIcon, CloseIcon } from './Icon';

interface ToastProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  autoHideMs?: number;
}

export function Toast({ open, onClose, title, description, autoHideMs = 4000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, autoHideMs);
    return () => clearTimeout(timer);
  }, [open, onClose, autoHideMs]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-50 -translate-x-1/2">
      <div className="pointer-events-auto flex min-w-[320px] items-start gap-3 rounded-2xl border border-ink-200 bg-white px-4 py-3 shadow-lg">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <CheckIcon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-ink-900">{title}</p>
          {description && <p className="text-xs text-ink-500">{description}</p>}
        </div>
        <button
          type="button"
          className="text-ink-400 hover:text-ink-700"
          onClick={onClose}
          aria-label="Закрыть уведомление"
        >
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  );
}
