import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingRow } from '../BookingRow';
import type { Booking } from '../../../api/types';

function booking(): Booking {
  return {
    id: 'b-1',
    roomId: 'room-1',
    userId: 'user-1',
    title: 'Daily Sync',
    comment: null,
    startsAt: '2026-10-24T12:00:00.000Z',
    endsAt: '2026-10-24T13:00:00.000Z',
    createdAt: '2026-10-20T00:00:00.000Z',
    room: {
      id: 'room-1',
      officeId: 'office-1',
      name: 'Эверест',
      floor: 4,
      capacity: 12,
      features: [],
    },
    office: {
      id: 'office-1',
      name: 'Офис Москва',
      address: 'Москва, ул. Лесная, 7',
      timezone: 'Europe/Moscow',
    },
    owner: {
      id: 'user-1',
      login: 'k',
      displayName: 'Константин',
      email: 'k@k',
      avatarUrl: null,
      initials: 'КК',
    },
  };
}

describe('BookingRow', () => {
  it('рендерит название, комнату и время в московской зоне', () => {
    render(<BookingRow booking={booking()} />);
    expect(screen.getByText('Daily Sync')).toBeInTheDocument();
    expect(screen.getByText('Эверест')).toBeInTheDocument();
    expect(screen.getByText(/15:00\s+—\s+16:00/)).toBeInTheDocument();
  });

  it('вызывает onCancel при клике по кнопке', async () => {
    const onCancel = vi.fn();
    render(<BookingRow booking={booking()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Отменить' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
