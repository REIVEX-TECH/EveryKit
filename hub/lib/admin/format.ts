/**
 * Small formatting rules for the dashboard, pure so they can be tested.
 */

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * "2 hours ago", and the rest.
 *
 * Deliberately coarse. The exact minute of a signup two months ago is noise,
 * and the point of this column is how stale a row is at a glance.
 */
export function relativeTime(iso: string, now = Date.now()): string {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) return "unknown";

  const ago = now - at;
  if (ago < 0) return "just now";
  if (ago < MINUTE) return "just now";

  const plural = (value: number, unit: string) =>
    `${value} ${unit}${value === 1 ? "" : "s"} ago`;

  if (ago < HOUR) return plural(Math.floor(ago / MINUTE), "minute");
  if (ago < DAY) return plural(Math.floor(ago / HOUR), "hour");
  if (ago < 30 * DAY) return plural(Math.floor(ago / DAY), "day");
  if (ago < 365 * DAY) return plural(Math.floor(ago / (30 * DAY)), "month");
  return plural(Math.floor(ago / (365 * DAY)), "year");
}

/**
 * One CSV row.
 *
 * Every field is quoted rather than only the ones that need it, which is valid
 * CSV and removes the question of whether this field is the one with the comma
 * in it. Quotes inside are doubled, per RFC 4180.
 *
 * The leading apostrophe on a field starting with =, +, - or @ is not
 * decoration: without it a spreadsheet treats the cell as a formula, and an
 * address is a string that a person chose.
 */
export function csvRow(fields: Array<string | number | null>): string {
  return (
    fields
      .map((field) => {
        const value = field === null || field === undefined ? "" : String(field);
        const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
        return `"${guarded.replace(/"/g, '""')}"`;
      })
      .join(",") + "\r\n"
  );
}
