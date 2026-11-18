import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildDefaultSlot,
  computeMaxIsoDate,
  computeMinIsoDate,
  isSlotInFuture,
  isSlotWithinAdvanceLimit,
  maxDurationForStart,
  slotToInterval,
} from '../bookingSlots';

const MOSCOW = 'Europe/Moscow';

describe('bookingSlots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-23T06:07:00Z')); // Пятница, 09:07 MSK
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('строит дефолтный слот с округлением вверх до шага 15 мин', () => {
    const slot = buildDefaultSlot(MOSCOW);
    expect(slot.isoDate).toBe('2026-10-23');
    expect(slot.startTime).toBe('09:15');
    expect(slot.durationMinutes).toBe(60);
  });

  it('переносит слот на следующий день, если рабочий день кончился', () => {
    vi.setSystemTime(new Date('2026-10-23T17:00:00Z')); // 20:00 MSK
    const slot = buildDefaultSlot(MOSCOW);
    expect(slot.isoDate).toBe('2026-10-24');
    expect(slot.startTime).toBe('09:00');
  });

  it('slotToInterval даёт корректный UTC-интервал', () => {
    const interval = slotToInterval(
      { isoDate: '2026-10-23', startTime: '15:00', durationMinutes: 60 },
      MOSCOW,
    );
    expect(interval.startsAt.toISOString()).toBe('2026-10-23T12:00:00.000Z');
    expect(interval.endsAt.toISOString()).toBe('2026-10-23T13:00:00.000Z');
  });

  it('вычисляет минимальную и максимальную даты (30 дней вперёд)', () => {
    expect(computeMinIsoDate(MOSCOW)).toBe('2026-10-23');
    expect(computeMaxIsoDate(MOSCOW)).toBe('2026-11-22');
  });

  it('проверяет, что слот в будущем', () => {
    expect(
      isSlotInFuture(
        { isoDate: '2026-10-23', startTime: '09:00', durationMinutes: 15 },
        MOSCOW,
      ),
    ).toBe(false);
    expect(
      isSlotInFuture(
        { isoDate: '2026-10-23', startTime: '15:00', durationMinutes: 15 },
        MOSCOW,
      ),
    ).toBe(true);
  });

  it('проверяет лимит 30 дней', () => {
    expect(
      isSlotWithinAdvanceLimit(
        { isoDate: '2026-11-22', startTime: '09:00', durationMinutes: 60 },
        MOSCOW,
      ),
    ).toBe(true);
    expect(
      isSlotWithinAdvanceLimit(
        { isoDate: '2026-11-23', startTime: '09:00', durationMinutes: 60 },
        MOSCOW,
      ),
    ).toBe(false);
  });

  it('ограничивает длительность рабочими часами', () => {
    expect(maxDurationForStart('19:45')).toBe(15);
    expect(maxDurationForStart('19:00')).toBe(60);
    expect(maxDurationForStart('09:00')).toBe(660);
  });
});
