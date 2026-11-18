import { describe, expect, it } from 'vitest';
import {
  addDays,
  alignMinutesUp,
  compareDateParts,
  formatDateShort,
  isoDateFromParts,
  minutesToLabel,
  partsFromIsoDate,
  toZonedParts,
  zonedToUtc,
} from '../datetime';

describe('datetime', () => {
  it('форматирует минуты в русские подписи', () => {
    expect(minutesToLabel(15)).toBe('15 мин');
    expect(minutesToLabel(60)).toBe('1 час');
    expect(minutesToLabel(120)).toBe('2 часа');
    expect(minutesToLabel(300)).toBe('5 часов');
    expect(minutesToLabel(75)).toBe('1 час 15 мин');
  });

  it('округляет минуты вверх кратно 15', () => {
    expect(alignMinutesUp(0)).toBe(0);
    expect(alignMinutesUp(1)).toBe(15);
    expect(alignMinutesUp(15)).toBe(15);
    expect(alignMinutesUp(16)).toBe(30);
    expect(alignMinutesUp(59)).toBe(60);
  });

  it('сериализует и парсит ISO-даты', () => {
    const parts = { year: 2026, month: 3, day: 5 };
    const iso = isoDateFromParts(parts);
    expect(iso).toBe('2026-03-05');
    expect(partsFromIsoDate(iso)).toEqual(parts);
  });

  it('корректно прибавляет дни с переходом через месяц', () => {
    expect(addDays({ year: 2026, month: 1, day: 30 }, 3)).toEqual({
      year: 2026,
      month: 2,
      day: 2,
    });
    expect(addDays({ year: 2026, month: 12, day: 31 }, 1)).toEqual({
      year: 2027,
      month: 1,
      day: 1,
    });
  });

  it('сравнивает даты по компонентам', () => {
    expect(
      compareDateParts({ year: 2026, month: 3, day: 5 }, { year: 2026, month: 3, day: 5 }),
    ).toBe(0);
    expect(
      compareDateParts({ year: 2026, month: 2, day: 5 }, { year: 2026, month: 3, day: 1 }),
    ).toBeLessThan(0);
  });

  it('форматирует короткую дату с днём недели', () => {
    const label = formatDateShort({ year: 2026, month: 10, day: 24, weekday: 4 });
    expect(label).toBe('24 Октября, Чт');
  });

  it('переводит зонированные компоненты в UTC (Europe/Moscow → +03)', () => {
    const utc = zonedToUtc(
      { year: 2026, month: 3, day: 5, hour: 15, minute: 0 },
      'Europe/Moscow',
    );
    expect(utc.toISOString()).toBe('2026-03-05T12:00:00.000Z');
  });

  it('делает round-trip UTC↔Moscow', () => {
    const source = { year: 2026, month: 10, day: 24, hour: 9, minute: 30 };
    const utc = zonedToUtc(source, 'Europe/Moscow');
    const back = toZonedParts(utc, 'Europe/Moscow');
    expect(back.year).toBe(source.year);
    expect(back.month).toBe(source.month);
    expect(back.day).toBe(source.day);
    expect(back.hour).toBe(source.hour);
    expect(back.minute).toBe(source.minute);
  });
});
