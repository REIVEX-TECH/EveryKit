/**
 * Unix time in both directions, and the relative phrasing that makes a number
 * mean something.
 *
 * The only genuinely tricky part is telling seconds from milliseconds, because
 * both are "a big number" and getting it wrong is off by a factor of a thousand
 * in either direction: 1,700,000,000 read as milliseconds is 1970, and
 * 1,700,000,000,000 read as seconds is the year 55,000.
 */

export type Unit = "seconds" | "milliseconds";

/**
 * Which unit a number is most likely in.
 *
 * Ten digits is seconds until roughly the year 2286 and thirteen is
 * milliseconds until then too, so the digit count is the signal. Anything
 * shorter is treated as seconds, which puts small numbers near 1970 where they
 * belong rather than in 1970 to the millisecond.
 */
export function guessUnit(value: number): Unit {
  return Math.abs(value) >= 1e11 ? "milliseconds" : "seconds";
}

export type ParsedStamp = { date: Date; unit: Unit; input: number };

export function parseStamp(raw: string, forced?: Unit): ParsedStamp | null {
  const text = raw.trim().replace(/[_,\s]/g, "");
  if (text === "" || !/^-?\d+$/.test(text)) return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;

  const unit = forced ?? guessUnit(value);
  const millis = unit === "seconds" ? value * 1000 : value;

  const date = new Date(millis);
  if (Number.isNaN(date.getTime())) return null;
  return { date, unit, input: value };
}

/**
 * A date typed as text, read as local time.
 *
 * `new Date("2026-08-21")` is midnight UTC, while `new Date("2026-08-21T00:00")`
 * is midnight where you are. Somebody typing a date into a box means the second
 * one, so the parts are pulled out and handed to the local constructor.
 */
export function parseLocalDateTime(raw: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw.trim());
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(
    Number(y), Number(mo) - 1, Number(d),
    Number(h ?? 0), Number(mi ?? 0), Number(s ?? 0), 0,
  );
  if (Number.isNaN(date.getTime())) return null;
  // Rejects 31 February rather than letting it roll into March.
  if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

export function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

/** ISO 8601 in UTC, seconds precision, which is what most APIs want. */
export function toIsoUtc(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** The same instant written out in whatever timezone the browser is in. */
export function toLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/** The browser's timezone name, for the label beside the local time. */
export function localZoneName(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "local time";
  } catch {
    return "local time";
  }
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * "3 hours ago", "in 2 days".
 *
 * Deliberately coarse and deliberately not `Intl.RelativeTimeFormat`: that
 * needs a unit picked before it is called, which is the entire problem, and its
 * output for the awkward cases reads worse than this does.
 */
export function relative(date: Date, now = Date.now()): string {
  const delta = date.getTime() - now;
  const ago = Math.abs(delta);
  const future = delta > 0;

  const say = (value: number, unit: string) => {
    const rounded = Math.floor(value);
    const plural = `${rounded} ${unit}${rounded === 1 ? "" : "s"}`;
    return future ? `in ${plural}` : `${plural} ago`;
  };

  if (ago < 45_000) return future ? "in a moment" : "just now";
  if (ago < HOUR) return say(ago / MINUTE, "minute");
  if (ago < DAY) return say(ago / HOUR, "hour");
  if (ago < MONTH) return say(ago / DAY, "day");
  if (ago < YEAR) return say(ago / MONTH, "month");
  return say(ago / YEAR, "year");
}
