import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingFormModal } from '../BookingFormModal';
import type { RoomSummary } from '../../../api/types';

const originalFetch = global.fetch;

function room(): RoomSummary {
  return {
    id: 'room-1',
    officeId: 'office-1',
    name: 'Эверест',
    floor: 4,
    capacity: 12,
    features: [],
    office: {
      id: 'office-1',
      name: 'Офис Москва',
      address: 'ул. Лесная 7',
      timezone: 'Europe/Moscow',
    },
  };
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('BookingFormModal', () => {
  it('показывает валидацию, если тема пустая', async () => {
    const user = userEvent.setup();
    render(
      <BookingFormModal
        open
        onClose={() => {}}
        room={room()}
        timezone="Europe/Moscow"
        onCreated={() => {}}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));
    expect(await screen.findByText('Обязательное поле')).toBeInTheDocument();
  });

  it('показывает экран конфликта при 409 и позволяет вернуться', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: { code: 'BOOKING_CONFLICT', message: 'Занято' },
        }),
        { status: 409, headers: { 'content-type': 'application/json' } },
      ),
    ) as unknown as typeof fetch;

    render(
      <BookingFormModal
        open
        onClose={() => {}}
        room={room()}
        timezone="Europe/Moscow"
        onCreated={() => {}}
      />,
    );
    await user.type(screen.getByPlaceholderText('Укажите тему встречи'), 'Sync');
    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Время уже занято')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Выбрать другое время' }));
    expect(screen.getByText('Новое бронирование')).toBeInTheDocument();
  });
});
