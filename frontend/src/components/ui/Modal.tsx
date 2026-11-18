import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { CloseIcon } from './Icon';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
  showCloseButton?: boolean;
  ariaLabel?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflowY;
    const previousFocus = document.activeElement;
    document.body.style.overflowY = 'hidden';
    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
        ) ?? [],
      );
    (focusable()[0] ?? dialogRef.current)?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const elements = focusable();
        const first = elements[0];
        const last = elements[elements.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflowY = previous;
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === 'sm' ? 'max-w-md' : 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 px-4 py-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby={title && !ariaLabel ? titleId : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={`w-full ${maxWidth} rounded-2xl bg-white shadow-xl`}
      >
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-6 pt-6">
            {title ? (
              <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {showCloseButton && (
              <button
                type="button"
                className="text-ink-400 hover:text-ink-700"
                aria-label="Закрыть"
                onClick={onClose}
              >
                <CloseIcon size={20} />
              </button>
            )}
          </div>
        )}
        <div className="px-6 pt-4 pb-2">{children}</div>
        {footer && <div className="px-6 pt-2 pb-6">{footer}</div>}
      </div>
    </div>
  );
}
