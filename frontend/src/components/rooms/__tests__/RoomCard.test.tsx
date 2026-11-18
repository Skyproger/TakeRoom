import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RoomCard } from '../RoomCard';
import type { RoomSummary } from '../../../api/types';

function room(available: boolean): RoomSummary {
  return {
    id: 'room-1',
    officeId: 'office-1',
    name: 'Эверест',
    floor: 4,
    capacity: 12,
    features: [],
    available,
    office: {
      id: 'office-1',
      name: 'Офис Москва',
      address: 'Москва, ул. Лесная, 7',
      timezone: 'Europe/Moscow',
    },
  };
}

describe('RoomCard', () => {
  it('показывает бейдж "Доступно" и работающую кнопку при available=true', async () => {
    const onBook = vi.fn();
    render(
      <MemoryRouter>
        <RoomCard
          room={room(true)}
          timezone="Europe/Moscow"
          filterEnabled
          onBook={onBook}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Доступно на выбранное время')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Забронировать' });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onBook).toHaveBeenCalledOnce();
  });

  it('делает кнопку недоступной при available=false', () => {
    render(
      <MemoryRouter>
        <RoomCard
          room={room(false)}
          timezone="Europe/Moscow"
          filterEnabled
          onBook={() => {}}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Недоступно на выбранное время')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Забронировать' })).toBeDisabled();
  });
});
