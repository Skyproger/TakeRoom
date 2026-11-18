import type { RoomSummary } from '../../api/types';
import { UsersIcon, featureIcon } from '../ui/Icon';

export function RoomInfoCard({ room }: { room: RoomSummary }) {
  return (
    <aside className="room-info">
      <header>
        <h1>{room.name}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {room.office.name}
          <br />
          {room.office.address}
        </p>
      </header>
      <div className="border-t border-ink-100 pt-4">
        <ul className="flex flex-col gap-3 text-sm text-ink-700">
          <li className="inline-flex items-center gap-3">
            <UsersIcon size={18} className="text-brand-500" />
            <span>Вместимость: до {room.capacity} человек</span>
          </li>
          {room.features.map((feature) => {
            const Icon = featureIcon(feature.code);
            return (
              <li key={feature.code} className="inline-flex items-center gap-3">
                <Icon size={18} className="text-brand-500" />
                <span>{feature.name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
