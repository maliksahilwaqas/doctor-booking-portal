// Day-list and open/closed-day logic for the token picker's day stepper.
// Dates are ISO "YYYY-MM-DD" strings throughout, handled in UTC so
// day-of-week math can't drift with the server's local timezone.

export const DOW_SHORT = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DayInfo {
  iso: string;
  weekday: number; // 1=Mon .. 7=Sun
  dow: string;
  day: number;
  month: string;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function dayInfo(iso: string): DayInfo {
  const d = new Date(`${iso}T00:00:00Z`);
  const jsWeekday = d.getUTCDay(); // 0=Sun..6=Sat
  return {
    iso,
    weekday: jsWeekday === 0 ? 7 : jsWeekday,
    dow: DOW_SHORT[jsWeekday === 0 ? 6 : jsWeekday - 1],
    day: d.getUTCDate(),
    month: MONTHS_SHORT[d.getUTCMonth()],
  };
}

export function buildDayList(startISO: string, count: number): DayInfo[] {
  return Array.from({ length: count }, (_, i) => dayInfo(addDaysISO(startISO, i)));
}

export function dayLabel(info: DayInfo): string {
  const dow = info.dow.charAt(0) + info.dow.slice(1).toLowerCase();
  return `${dow} ${info.day} ${info.month}`;
}

export function dayKicker(dayIndex: number): string {
  if (dayIndex === 0) return "TODAY";
  if (dayIndex === 1) return "TOMORROW";
  return `IN ${dayIndex} DAYS`;
}

export function isDayOpen(locationDays: number[], offDays: number[], weekday: number): boolean {
  return locationDays.includes(weekday) && !offDays.includes(weekday);
}

/**
 * From `fromIndex`, search forward (dir=1) or backward (dir=-1) through
 * `dayList` for the next open day. Falls back to searching the opposite
 * direction if none is found (mirrors the mockup's day-stepper fallback).
 */
export function findOpenDayIndex(
  dayList: DayInfo[],
  locationDays: number[],
  offDays: number[],
  fromIndex: number,
  dir: 1 | -1,
): number {
  const open = (i: number) => isDayOpen(locationDays, offDays, dayList[i].weekday);
  for (let k = 1; k < dayList.length; k++) {
    const i = fromIndex + dir * k;
    if (i >= 0 && i < dayList.length && open(i)) return i;
  }
  for (let k = 1; k < dayList.length; k++) {
    const i = fromIndex - dir * k;
    if (i >= 0 && i < dayList.length && open(i)) return i;
  }
  return fromIndex;
}

export function closedDayReason(locationName: string, offDays: number[], weekday: number): string {
  return offDays.includes(weekday) ? "is the doctor’s off day" : `has no sitting at ${locationName}`;
}
