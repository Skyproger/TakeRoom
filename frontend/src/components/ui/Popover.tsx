import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface PopoverProps {
  trigger: (state: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Popover({ trigger, children, align = 'left', className }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className={['relative inline-block', className ?? ''].join(' ')}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={[
            'absolute z-30 mt-2 min-w-[220px] rounded-lg border border-ink-200 bg-white shadow-xl',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
