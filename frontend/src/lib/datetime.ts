export const MINUTES_STEP = 15;
export const WORK_START_MINUTES = 9 * 60;
export const WORK_END_MINUTES = 20 * 60;
export const MAX_ADVANCE_DAYS = 30;

const MONTH_NAMES_NOMINATIVE = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

const MONTH_NAMES_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
];

const WEEKDAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const WEEKDAY_LONG = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
];

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number;
  offsetMinutes: number;
}

const DATE_TIME_FORMATTER_CACHE = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
  let formatter = DATE_TIME_FORMATTER_CACHE.get(timezone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
      hour12: false,
    });
    DATE_TIME_FORMATTER_CACHE.set(timezone, formatter);
  }
  return formatter;
}

function readParts(date: Date, timezone: string): ZonedParts {
  const parts = getFormatter(timezone).formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  const minute = Number(map.minute);
  const second = Number(map.second);
  const weekday = weekdayShortToIndex(map.weekday ?? 'Mon');

  const asUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = Math.round((asUtc - date.getTime()) / 60000);

  return { year, month, day, hour, minute, weekday, offsetMinutes };
}

function weekdayShortToIndex(value: string): number {
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[value] ?? 0;
}

export function toZonedParts(date: Date | string, timezone: string): ZonedParts {
  const source = date instanceof Date ? date : new Date(date);
  return readParts(source, timezone);
}

export function zonedToUtc(
  parts: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  },
  timezone: string,
): Date {
  const utcGuess = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    0,
    0,
  );
  const guessDate = new Date(utcGuess);
  const projected = readParts(guessDate, timezone);
  const projectedUtc = Date.UTC(
    projected.year,
    projected.month - 1,
    projected.day,
    projected.hour,
    projected.minute,
    0,
  );
  const diff = projectedUtc - utcGuess;
  return new Date(utcGuess - diff);
}

export function pad2(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatHm(parts: { hour: number; minute: number }): string {
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

export function formatRangeHm(
  start: { hour: number; minute: number },
  end: { hour: number; minute: number },
): string {
  return `${formatHm(start)} — ${formatHm(end)}`;
}

export function minutesToLabel(minutes: number): string {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return declineHours(hours);
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes - hours * 60;
  if (hours === 0) return `${mins} мин`;
  return `${declineHours(hours)} ${mins} мин`;
}

function declineHours(hours: number): string {
  const mod10 = hours % 10;
  const mod100 = hours % 100;
  if (mod10 === 1 && mod100 !== 11) return `${hours} час`;
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100))
    return `${hours} часа`;
  return `${hours} часов`;
}

export function isoDateFromParts(parts: {
  year: number;
  month: number;
  day: number;
}): string {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function partsFromIsoDate(value: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
}

export function addDays(parts: { year: number; month: number; day: number }, days: number) {
  const utc = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function formatDateLong(parts: {
  year: number;
  month: number;
  day: number;
}): string {
  const { day, month, year } = parts;
  return `${day} ${MONTH_NAMES_GENITIVE[month - 1]} ${year}`;
}

export function formatDateShort(parts: {
  year: number;
  month: number;
  day: number;
  weekday: number;
}): string {
  return `${parts.day} ${capitalize(MONTH_NAMES_GENITIVE[parts.month - 1])}, ${WEEKDAY_SHORT[parts.weekday]}`;
}

export function formatWeekdayFull(index: number): string {
  return WEEKDAY_LONG[index] ?? '';
}

export function formatMonthName(index: number): string {
  return MONTH_NAMES_NOMINATIVE[index - 1] ?? '';
}

export function monthShortLabel(monthIndex1Based: number): string {
  const names = [
    'ЯНВАРЬ',
    'ФЕВРАЛЬ',
    'МАРТ',
    'АПРЕЛЬ',
    'МАЙ',
    'ИЮНЬ',
    'ИЮЛЬ',
    'АВГУСТ',
    'СЕНТЯБРЬ',
    'ОКТЯБРЬ',
    'НОЯБРЬ',
    'ДЕКАБРЬ',
  ];
  return names[monthIndex1Based - 1] ?? '';
}

function capitalize(word: string | undefined | null): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function shortTimezone(timezone: string, atDate = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(atDate);
    const name = parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
    if (name.startsWith('GMT+3')) return 'MSK';
    return name.replace(/^GMT/, 'UTC');
  } catch {
    return timezone;
  }
}

export function nowInZone(timezone: string): ZonedParts {
  return readParts(new Date(), timezone);
}

export function isSameDay(a: ZonedParts, b: ZonedParts): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function compareDateParts(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function alignMinutesUp(minutes: number, step = MINUTES_STEP): number {
  return Math.ceil(minutes / step) * step;
}

export function minutesFromParts(parts: { hour: number; minute: number }): number {
  return parts.hour * 60 + parts.minute;
}

export function partsFromMinutes(minutes: number): { hour: number; minute: number } {
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  return { hour: Math.floor(normalized / 60), minute: normalized % 60 };
}
