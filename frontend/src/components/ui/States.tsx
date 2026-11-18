import type { ReactNode } from 'react';
import { AlertIcon, BuildingIcon } from './Icon';
import { Button } from './Button';

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={['animate-pulse rounded-xl bg-ink-100', className ?? 'h-24 w-full'].join(' ')}
    />
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex items-center justify-center text-ink-500">
        {icon ?? <BuildingIcon size={36} />}
      </div>
      <h3 className="text-xl font-semibold text-ink-900">{title}</h3>
      {description && <p className="max-w-md text-ink-500 whitespace-pre-line">{description}</p>}
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorState({
  title = 'Не удалось загрузить данные',
  description = 'Проверьте соединение и попробуйте ещё раз.',
  onRetry,
  retryLabel = 'Повторить',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="flex items-center justify-center text-danger-600">
        <AlertIcon size={36} />
      </div>
      <h3 className="text-xl font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-ink-500">{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
