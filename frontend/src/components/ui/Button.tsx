import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerOutline' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: ReactNode;
  block?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition cursor-pointer ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand-400 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-600 active:bg-brand-700 ' +
    'disabled:bg-ink-100 disabled:text-ink-500',
  secondary: 'bg-white text-ink-800 border border-ink-200 hover:bg-ink-50 active:bg-ink-100',
  ghost: 'bg-transparent text-brand-600 hover:bg-brand-50',
  danger: 'bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-600',
  dangerOutline: 'bg-white text-danger-600 border border-danger-500 hover:bg-danger-50',
  link: 'bg-transparent text-brand-600 hover:text-brand-700 underline-offset-4 hover:underline px-0 py-0',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-5 py-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leadingIcon,
    block,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const sizeClass = variant === 'link' ? '' : sizes[size];
  return (
    <button
      ref={ref}
      type={type}
      className={[base, variants[variant], sizeClass, block ? 'w-full' : '', className ?? '']
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {leadingIcon ? <span className="shrink-0">{leadingIcon}</span> : null}
      {children}
    </button>
  );
});
