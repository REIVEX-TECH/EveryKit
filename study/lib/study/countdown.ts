/**
 * A shareable exam countdown, encoded entirely in the URL.
 *
 * The point of the design is that nothing is stored. The exam name and date
 * live in the query string of the link, so a countdown is just a URL you can
 * text to a friend, and there is no database, no account and no record of it
 * anywhere. The page says so under the share button, because "this link
 * contains the details you typed" is the honest description of how it works.
 *
 * Pure and Date-free where it can be: the time-left maths takes "now" as an
 * argument so it is tested against fixed clocks rather than the real one.
 */

export type CountdownParams = { name: string; date: string };

/** Read the name and date out of a query string. */
export function parseCountdown(search: string): CountdownParams | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const name = (params.get("n") ?? "").trim();
  const date = (params.get("d") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return { name: name.slice(0, 80), date };
}

/** Build the query string for a countdown. The name is capped so a link stays sane. */
export function buildCountdownQuery(params: CountdownParams): string {
  const q = new URLSearchParams();
  if (params.name.trim()) q.set("n", params.name.trim().slice(0, 80));
  q.set("d", params.date);
  return `?${q.toString()}`;
}

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  /** True when the exam datetime is in the past. */
  passed: boolean;
};

/**
 * How long until the given local date, counted from `now`.
 *
 * The exam date is treated as its own day ending at midnight local time: a
 * countdown to "the 5th" should read zero on the 5th, not the 4th, so the
 * target is the end of that day. Both are compared as local times, because an
 * exam at 9am is a local-calendar event, not a UTC instant.
 */
export function timeLeft(dateIso: string, now: Date): TimeLeft {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
  if (!match) return { days: 0, hours: 0, minutes: 0, passed: true };
  const [, y, m, d] = match.map(Number) as unknown as [string, number, number, number];
  // End of the exam day, local time.
  const target = new Date(y as unknown as number, m - 1, d, 23, 59, 59, 999);
  let diff = target.getTime() - now.getTime();
  if (diff < 0) return { days: 0, hours: 0, minutes: 0, passed: true };

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const days = Math.floor(diff / day);
  diff -= days * day;
  const hours = Math.floor(diff / hour);
  diff -= hours * hour;
  const minutes = Math.floor(diff / minute);
  return { days, hours, minutes, passed: false };
}

/** A short sentence for the countdown, or a done message once it has passed. */
export function countdownSentence(left: TimeLeft, name: string): string {
  const label = name.trim() || "your exam";
  if (left.passed) return `${label} has passed. Good luck with the results.`;
  const parts: string[] = [];
  if (left.days) parts.push(`${left.days} ${left.days === 1 ? "day" : "days"}`);
  if (left.hours) parts.push(`${left.hours} ${left.hours === 1 ? "hour" : "hours"}`);
  // Always show minutes when there are no days, so the last hour still counts down.
  if (left.minutes || parts.length === 0) {
    parts.push(`${left.minutes} ${left.minutes === 1 ? "minute" : "minutes"}`);
  }
  return `${joinParts(parts)} until ${label}.`;
}

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
