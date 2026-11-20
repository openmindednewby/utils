const ISO_DATE_LENGTH = 10;
const YEAR_LENGTH = 4;
const PERIOD_LENGTH = 7;
const MONTH_START = 5;
const MONTHS_PER_QUARTER = 3;
const MS_PER_MINUTE = 60000;
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Returns today in the user's own time zone as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * MS_PER_MINUTE);
  return local.toISOString().slice(0, ISO_DATE_LENGTH);
}

/** Returns the YYYY-MM of a date. */
export function periodOf(date: string): string {
  return date.slice(0, PERIOD_LENGTH);
}

/** Returns the last day of a YYYY-MM month as YYYY-MM-DD. */
export function lastDayOfPeriod(period: string): string {
  const year = Number(period.slice(0, YEAR_LENGTH));
  const month = Number(period.slice(MONTH_START, PERIOD_LENGTH));
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, ISO_DATE_LENGTH);
}

/** Names a YYYY-MM month in the given language. */
export function monthName(
  period: string,
  language: string,
  style: Intl.DateTimeFormatOptions['month'] = 'long'
): string {
  return new Date(`${period}-15T00:00:00Z`).toLocaleDateString(language, {
    month: style,
    timeZone: 'UTC',
  });
}

/** Returns the quarter, 1 to 4, of a date. */
export function quarterOf(date: string): number {
  return Math.ceil(Number(periodOf(date).slice(MONTH_START)) / MONTHS_PER_QUARTER);
}

/** Says whether a text is a real month written as YYYY-MM. */
export function isMonth(text: string): boolean {
  return MONTH_PATTERN.test(text);
}
