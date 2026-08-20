/**
 * Age, and the distance between two dates.
 *
 * All of it in whole local days. A date somebody types is a calendar date, not
 * an instant: "5 August" means that day where they are, and converting it to
 * UTC midnight moves it a day for half the world. Everything here is built with
 * the local Date constructor and compared at midday, which is the trick that
 * makes a daylight saving jump unable to knock a day count off by one.
 */

export type Ymd = { year: number; month: number; day: number };

/** A date input's value, or null when it is not a real date. */
export function parseDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;

  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects 31 February rather than letting it roll into March.
  if (date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

/** Midday, so an hour of daylight saving cannot move the date. */
export function atMidday(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days between two dates, ignoring the time of day entirely. */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((atMidday(to).getTime() - atMidday(from).getTime()) / DAY_MS);
}

export type Duration = { years: number; months: number; days: number };

/**
 * The date a given number of months after another one.
 *
 * The rollover is JavaScript's own and it is the behaviour wanted here rather
 * than something to correct: 29 February plus twelve months lands on 1 March in
 * a common year, which is the day most people and most jurisdictions treat as
 * the anniversary. `nextBirthday` below picks the same day, so the age and the
 * countdown can never disagree with each other.
 */
function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate(), 12, 0, 0, 0);
}

/**
 * The gap as years, months and days, the way a person counts an age.
 *
 * Counted by finding the last whole monthly anniversary that has actually
 * passed and then counting real days from it, rather than by subtracting the
 * calendar fields and borrowing. Subtracting is where every off by one in this
 * kind of code lives: 31 January to 1 March cannot be resolved by borrowing the
 * length of February, because the answer goes negative and borrowing again
 * gives a different unit.
 *
 * A consequence worth knowing: 31 January to 1 March comes out as 30 days
 * rather than as "1 month and 1 day". There is no 31 February for the month to
 * complete on, and inventing one by clamping to the 28th would be a guess. The
 * day count is the part that is not a matter of opinion.
 */
export function exactDuration(from: Date, to: Date): Duration {
  const start = atMidday(from);
  const end = atMidday(to);
  if (end.getTime() < start.getTime()) {
    const flipped = exactDuration(to, from);
    return { years: -flipped.years, months: -flipped.months, days: -flipped.days };
  }

  // An upper estimate, then walked back to the last anniversary that has been
  // reached. At most two steps, because the estimate is never more than one
  // month over.
  let months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  while (months > 0 && addMonths(start, months).getTime() > end.getTime()) months--;

  const anniversary = addMonths(start, months);
  return {
    years: Math.floor(months / 12),
    months: months % 12,
    days: daysBetween(anniversary, end),
  };
}

/** "25 years, 3 months and 14 days", with the empty parts left out. */
export function describeDuration(duration: Duration): string {
  const parts: string[] = [];
  const add = (value: number, unit: string) => {
    if (value !== 0) parts.push(`${value} ${unit}${Math.abs(value) === 1 ? "" : "s"}`);
  };
  add(duration.years, "year");
  add(duration.months, "month");
  add(duration.days, "day");

  if (parts.length === 0) return "0 days";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * The next birthday after `on`, and how many days away it is.
 *
 * A 29 February birthday is observed on 1 March in a common year. That is a
 * choice rather than a fact, and it is the one most jurisdictions and most
 * people make, so it is what the tool does and what the tool says it does.
 */
export function nextBirthday(born: Date, on: Date): { date: Date; days: number; isLeapDay: boolean } {
  const today = atMidday(on);
  const isLeapDay = born.getMonth() === 1 && born.getDate() === 29;

  const build = (year: number) => {
    if (!isLeapDay) return new Date(year, born.getMonth(), born.getDate(), 12, 0, 0, 0);
    const leapYear = new Date(year, 1, 29, 12, 0, 0, 0).getMonth() === 1;
    return leapYear
      ? new Date(year, 1, 29, 12, 0, 0, 0)
      : new Date(year, 2, 1, 12, 0, 0, 0);
  };

  let candidate = build(today.getFullYear());
  if (candidate.getTime() < today.getTime()) candidate = build(today.getFullYear() + 1);

  return { date: candidate, days: daysBetween(today, candidate), isLeapDay };
}

export type DifferenceResult = {
  days: number;
  weeks: number;
  /** Whole weeks and the days left over, which is how people say it. */
  remainderDays: number;
  months: number;
  duration: Duration;
};

/**
 * The gap between two dates.
 *
 * `includeEnd` is the difference between "how many days between the 1st and the
 * 5th" (four) and "how many days am I away, counting today" (five). Both
 * questions are asked constantly and each is wrong for the other, so the choice
 * is a visible switch rather than a hidden assumption.
 */
export function difference(from: Date, to: Date, includeEnd: boolean): DifferenceResult {
  const raw = Math.abs(daysBetween(from, to));
  const days = includeEnd ? raw + 1 : raw;
  const duration = exactDuration(
    from.getTime() <= to.getTime() ? from : to,
    from.getTime() <= to.getTime() ? to : from,
  );

  return {
    days,
    weeks: Math.floor(days / 7),
    remainderDays: days % 7,
    months: duration.years * 12 + duration.months,
    duration,
  };
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Wednesday, 5 August 2026", which is how a date reads out loud. */
export function longDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** An ISO date string for a date input's value. */
export function toIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
