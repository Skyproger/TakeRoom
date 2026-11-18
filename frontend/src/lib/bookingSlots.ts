import {
  MAX_ADVANCE_DAYS,
  MINUTES_STEP,
  WORK_END_MINUTES,
  WORK_START_MINUTES,
  alignMinutesUp,
  addDays,
  compareDateParts,
  formatHm,
  isoDateFromParts,
  minutesFromParts,
  nowInZone,
  partsFromIsoDate,
  partsFromMinutes,
  zonedToUtc,
} from './datetime';

export interface FilterSlot {
  isoDate: string;
  startTime: string;
  durationMinutes: number;
}

export const DEFAULT_DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 105, 120];
export const CAPACITY_OPTIONS = [2, 4, 6, 8, 10, 12];

export function buildDefaultSlot(timezone: string): FilterSlot {
  const now = nowInZone(timezone);
  const todayIso = isoDateFromParts({
    year: now.year,
    month: now.month,
    day: now.day,
  });

  let alignedMinutes = alignMinutesUp(minutesFromParts(now));
  let isoDate = todayIso;

  if (alignedMinutes > WORK_END_MINUTES - MINUTES_STEP) {
    const next = addDays({ year: now.year, month: now.month, day: now.day }, 1);
    isoDate = isoDateFromParts(next);
    alignedMinutes = WORK_START_MINUTES;
  }

  if (alignedMinutes < WORK_START_MINUTES) alignedMinutes = WORK_START_MINUTES;

  const startTime = formatHm(partsFromMinutes(alignedMinutes));
  return {
    isoDate,
    startTime,
    durationMinutes: 60,
  };
}

export function computeMinIsoDate(timezone: string): string {
  const now = nowInZone(timezone);
  return isoDateFromParts({ year: now.year, month: now.month, day: now.day });
}

export function computeMaxIsoDate(timezone: string): string {
  const now = nowInZone(timezone);
  const maxParts = addDays(
    { year: now.year, month: now.month, day: now.day },
    MAX_ADVANCE_DAYS,
  );
  return isoDateFromParts(maxParts);
}

export function slotToInterval(
  slot: FilterSlot,
  timezone: string,
): { startsAt: Date; endsAt: Date } {
  const dateParts = partsFromIsoDate(slot.isoDate);
  const [hour, minute] = slot.startTime.split(':').map(Number);
  const startsAt = zonedToUtc(
    { ...dateParts, hour, minute },
    timezone,
  );
  const endsAt = new Date(startsAt.getTime() + slot.durationMinutes * 60_000);
  return { startsAt, endsAt };
}

export function endMinutesFor(slot: FilterSlot): number {
  const [hour, minute] = slot.startTime.split(':').map(Number);
  return hour * 60 + minute + slot.durationMinutes;
}

export function maxDurationForStart(startTime: string): number {
  const [hour, minute] = startTime.split(':').map(Number);
  return Math.max(MINUTES_STEP, WORK_END_MINUTES - (hour * 60 + minute));
}

export function isSlotInFuture(slot: FilterSlot, timezone: string): boolean {
  const { startsAt } = slotToInterval(slot, timezone);
  return startsAt.getTime() > Date.now();
}

export function isSlotWithinAdvanceLimit(
  slot: FilterSlot,
  timezone: string,
): boolean {
  const now = nowInZone(timezone);
  const nowParts = { year: now.year, month: now.month, day: now.day };
  const maxParts = addDays(nowParts, MAX_ADVANCE_DAYS);
  const slotDate = partsFromIsoDate(slot.isoDate);
  return compareDateParts(slotDate, maxParts) <= 0;
}
