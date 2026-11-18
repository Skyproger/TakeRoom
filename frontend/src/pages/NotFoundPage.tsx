import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { HomeIcon } from '../components/ui/Icon';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="text-2xl font-semibold text-ink-900">Страница не найдена</h1>
      <p className="text-ink-500">
        Запрашиваемая страница не существует, была удалена или перенесена на другой адрес.
      </p>
      <Link to="/rooms" className="mt-2">
        <Button leadingIcon={<HomeIcon size={18} />} size="lg">
          Вернуться к переговорным
        </Button>
      </Link>
    </div>
  );
}
