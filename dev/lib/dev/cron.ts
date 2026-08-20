/**
 * A cron expression, parsed into what it means and when it next fires.
 *
 * Hand written rather than pulled from a package, because the whole product
 * here is the explanation: a library that returns the next run times still
 * leaves the sentence to write, and the sentence is the thing people came for.
 *
 * Standard five field syntax only. No seconds field, no @yearly aliases, no
 * step on a bare list, and no natural language going the other way. Those are
 * all real, and all of them are the kind of half-support that makes somebody
 * trust an answer that is wrong.
 *
 * The one rule worth knowing before reading the rest: when both day of month
 * and day of week are restricted, cron runs the job when EITHER matches, not
 * both. `0 0 13 * FRI` is the thirteenth of every month AND every Friday. It
 * looks like a bug and it is the behaviour every cron implementation shares,
 * so it is implemented here and stated on the page.
 */

export type FieldName = "minute" | "hour" | "dayOfMonth" | "month" | "dayOfWeek";

export type CronError = {
  /** Which of the five fields is wrong, or null when the shape itself is. */
  field: FieldName | null;
  message: string;
};

export type CronParsed = {
  minutes: number[];
  hours: number[];
  daysOfMonth: number[];
  months: number[];
  daysOfWeek: number[];
  /** True when the field was `*`, which the OR rule above depends on. */
  domRestricted: boolean;
  dowRestricted: boolean;
};

export type CronResult =
  | { ok: true; parsed: CronParsed; description: string }
  | { ok: false; error: CronError };

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const MONTH_WORDS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_WORDS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

type FieldSpec = {
  name: FieldName;
  min: number;
  max: number;
  /** Names accepted in this field, indexed from `min`. */
  names?: string[];
  label: string;
};

const FIELDS: FieldSpec[] = [
  { name: "minute", min: 0, max: 59, label: "minute" },
  { name: "hour", min: 0, max: 23, label: "hour" },
  { name: "dayOfMonth", min: 1, max: 31, label: "day of month" },
  { name: "month", min: 1, max: 12, names: MONTH_NAMES, label: "month" },
  { name: "dayOfWeek", min: 0, max: 6, names: DAY_NAMES, label: "day of week" },
];

/**
 * One value in a field: a number, or a name this field accepts.
 *
 * Sunday is both 0 and 7 in every cron worth matching, so 7 is folded to 0
 * here rather than rejected. A user who wrote 7 meant Sunday.
 */
function parseValue(raw: string, spec: FieldSpec): number | null {
  const token = raw.trim().toUpperCase();
  if (token === "") return null;

  if (spec.names) {
    const named = spec.names.indexOf(token);
    if (named >= 0) return named + spec.min;
  }

  if (!/^\d+$/.test(token)) return null;
  const value = Number(token);

  if (spec.name === "dayOfWeek" && value === 7) return 0;
  if (value < spec.min || value > spec.max) return null;
  return value;
}

function fail(field: FieldName | null, message: string): CronResult {
  return { ok: false, error: { field, message } };
}

/** Every value one field selects, sorted and deduplicated. */
function parseField(raw: string, spec: FieldSpec): number[] | CronError {
  const out = new Set<number>();

  for (const part of raw.split(",")) {
    const piece = part.trim();
    if (piece === "") {
      return { field: spec.name, message: `The ${spec.label} has an empty item in its list.` };
    }

    const [rangePart, stepPart, ...extra] = piece.split("/");
    if (extra.length > 0) {
      return { field: spec.name, message: `The ${spec.label} has more than one step in "${piece}".` };
    }

    let step = 1;
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart.trim()) || Number(stepPart) === 0) {
        return {
          field: spec.name,
          message: `The step in "${piece}" has to be a whole number above zero.`,
        };
      }
      step = Number(stepPart);
    }

    let from: number;
    let to: number;

    if (rangePart.trim() === "*") {
      from = spec.min;
      to = spec.max;
    } else if (rangePart.includes("-")) {
      const [a, b, ...rest] = rangePart.split("-");
      if (rest.length > 0) {
        return { field: spec.name, message: `"${piece}" is not a range the ${spec.label} understands.` };
      }
      const start = parseValue(a, spec);
      const end = parseValue(b, spec);
      if (start === null || end === null) {
        return {
          field: spec.name,
          message: `The ${spec.label} accepts ${describeRange(spec)}, so "${rangePart}" does not fit.`,
        };
      }
      if (start > end) {
        // Deliberately refused rather than wrapped. A wrapping range is
        // ambiguous enough that guessing produces a schedule nobody predicted.
        return {
          field: spec.name,
          message: `The range "${rangePart}" runs backwards. Write it low to high, or use two items separated by a comma.`,
        };
      }
      from = start;
      to = end;
    } else {
      const single = parseValue(rangePart, spec);
      if (single === null) {
        return {
          field: spec.name,
          message: `The ${spec.label} accepts ${describeRange(spec)}, so "${rangePart.trim()}" does not fit.`,
        };
      }
      // `5/15` means "from 5 to the end of the field, every 15", which is how
      // every cron reads a step on a single value.
      from = single;
      to = stepPart === undefined ? single : spec.max;
    }

    for (let value = from; value <= to; value += step) out.add(value);
  }

  return [...out].sort((a, b) => a - b);
}

function describeRange(spec: FieldSpec): string {
  const numbers = `${spec.min} to ${spec.max}`;
  if (!spec.names) return numbers;
  return `${numbers}, or ${spec.names[0]} to ${spec.names[spec.names.length - 1]}`;
}

/** Parse an expression, or say exactly what is wrong with it. */
export function parseCron(expression: string): CronResult {
  const trimmed = expression.trim();
  if (trimmed === "") {
    return fail(null, "Enter a cron expression, five fields separated by spaces.");
  }

  if (trimmed.startsWith("@")) {
    return fail(
      null,
      "Shorthands like @daily are not read here. Write the five fields out: @daily is 0 0 * * *.",
    );
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return fail(
      null,
      `A cron expression has five fields: minute, hour, day of month, month, day of week. This has ${parts.length}.`,
    );
  }

  const values: number[][] = [];
  for (let i = 0; i < FIELDS.length; i++) {
    const result = parseField(parts[i], FIELDS[i]);
    if (!Array.isArray(result)) return { ok: false, error: result };
    if (result.length === 0) {
      return fail(FIELDS[i].name, `The ${FIELDS[i].label} selects nothing at all.`);
    }
    values.push(result);
  }

  const parsed: CronParsed = {
    minutes: values[0],
    hours: values[1],
    daysOfMonth: values[2],
    months: values[3],
    daysOfWeek: values[4],
    domRestricted: parts[2].trim() !== "*",
    dowRestricted: parts[4].trim() !== "*",
  };

  return { ok: true, parsed, description: describe(parsed) };
}

/** "a, b and c", which is how a person reads a list out loud. */
function list(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** True when the values are every step apart across the whole field. */
function isEveryStep(values: number[], min: number, max: number): number | null {
  if (values.length < 2 || values[0] !== min) return null;
  const step = values[1] - values[0];
  if (step < 2) return null;
  for (let i = 1; i < values.length; i++) {
    if (values[i] - values[i - 1] !== step) return null;
  }
  // The last value must be the last one that fits, or this is a range rather
  // than a step across the field.
  return values[values.length - 1] + step > max ? step : null;
}

function isFullRange(values: number[], min: number, max: number): boolean {
  return values.length === max - min + 1;
}

function two(value: number): string {
  return String(value).padStart(2, "0");
}

/** Turn a parsed expression into one plain sentence. */
export function describe(parsed: CronParsed): string {
  const { minutes, hours, daysOfMonth, months, daysOfWeek } = parsed;

  const everyMinute = isFullRange(minutes, 0, 59);
  const everyHour = isFullRange(hours, 0, 23);
  const minuteStep = isEveryStep(minutes, 0, 59);
  const hourStep = isEveryStep(hours, 0, 23);

  let time: string;
  if (everyMinute && everyHour) {
    time = "Every minute";
  } else if (minuteStep !== null && everyHour) {
    time = `Every ${minuteStep} minutes`;
  } else if (everyMinute) {
    time = `Every minute of ${list(hours.map((h) => `${two(h)}:00`))}`;
  } else if (hourStep !== null && minutes.length === 1) {
    time = `At ${two(minutes[0])} minutes past every ${hourStep} hours`;
  } else if (everyHour && minutes.length === 1) {
    time = minutes[0] === 0
      ? "At the top of every hour"
      : `At ${minutes[0]} minutes past every hour`;
  } else if (everyHour) {
    time = `At ${list(minutes.map((m) => `${m} minutes past`))} every hour`;
  } else {
    const clock: string[] = [];
    for (const hour of hours) for (const minute of minutes) clock.push(`${two(hour)}:${two(minute)}`);
    // Past a handful the sentence stops being readable and starts being a list.
    time = clock.length > 8 ? `At ${clock.length} times a day` : `At ${list(clock)}`;
  }

  const parts: string[] = [];

  const everyDom = isFullRange(daysOfMonth, 1, 31);
  const everyDow = isFullRange(daysOfWeek, 0, 6);
  const everyMonth = isFullRange(months, 1, 12);

  if (!everyDom) {
    const domStep = isEveryStep(daysOfMonth, 1, 31);
    parts.push(
      domStep !== null
        ? `every ${domStep} days`
        : `on the ${list(daysOfMonth.map(ordinal))}`,
    );
  }

  if (!everyDow) {
    const consecutive =
      daysOfWeek.length > 2 &&
      daysOfWeek.every((day, i) => i === 0 || day === daysOfWeek[i - 1] + 1);
    parts.push(
      consecutive
        ? `${DAY_WORDS[daysOfWeek[0]]} to ${DAY_WORDS[daysOfWeek[daysOfWeek.length - 1]]}`
        : `on ${list(daysOfWeek.map((day) => DAY_WORDS[day]))}`,
    );
  }

  if (everyDom && everyDow) parts.push("every day");

  if (!everyMonth) {
    const consecutive =
      months.length > 2 && months.every((m, i) => i === 0 || m === months[i - 1] + 1);
    parts.push(
      consecutive
        ? `from ${MONTH_WORDS[months[0] - 1]} to ${MONTH_WORDS[months[months.length - 1] - 1]}`
        : `in ${list(months.map((m) => MONTH_WORDS[m - 1]))}`,
    );
  }

  // Joined with commas rather than "and": these are different kinds of clause,
  // and "on the 1st and in January" is not a sentence anybody says.
  let sentence = `${time}, ${parts.join(", ")}.`;

  // The OR rule, said out loud, because a schedule that fires on two unrelated
  // conditions is the single most surprising thing cron does.
  if (parsed.domRestricted && parsed.dowRestricted) {
    sentence += " Both the day of month and the day of week are set, so it runs when either one matches.";
  }

  return sentence;
}

function ordinal(value: number): string {
  const rem100 = value % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${value}th`;
  switch (value % 10) {
    case 1: return `${value}st`;
    case 2: return `${value}nd`;
    case 3: return `${value}rd`;
    default: return `${value}th`;
  }
}

/**
 * How far ahead the search looks, and how hard it is allowed to work.
 *
 * Eight years, because 29 February on a schedule that also pins the month can
 * be four years apart and somebody asking for five of those needs the fifth.
 * The iteration cap is the backstop: an expression that can never fire, like
 * the 30th of February, has to give up quickly rather than spin.
 */
const SEARCH_HORIZON_YEARS = 8;
const SEARCH_MAX_STEPS = 500_000;

/**
 * The next run times after `from`, in the local timezone.
 *
 * Minute by minute rather than clever: four years of minutes is two million
 * iterations in the worst case, which is milliseconds, and a date arithmetic
 * shortcut is where an off by one hides for months. The date is built with the
 * local Date constructor, so a daylight saving jump is the platform's problem
 * to get right rather than this file's to reimplement.
 */
export function nextRuns(parsed: CronParsed, from: Date, count = 5): Date[] {
  const out: Date[] = [];

  const cursor = new Date(from.getTime());
  cursor.setSeconds(0, 0);
  cursor.setMinutes(cursor.getMinutes() + 1);

  const horizon = new Date(from.getTime());
  horizon.setFullYear(horizon.getFullYear() + SEARCH_HORIZON_YEARS);

  for (let step = 0; step < SEARCH_MAX_STEPS && out.length < count; step++) {
    if (cursor.getTime() > horizon.getTime()) break;

    // Skip a whole day at a time when the date cannot match, and a whole hour
    // when the hour cannot. Grinding minute by minute through eight years of
    // "the 30th of February" is four million iterations to answer "never".
    if (!dateMatches(parsed, cursor)) {
      cursor.setDate(cursor.getDate() + 1);
      cursor.setHours(0, 0, 0, 0);
      continue;
    }
    if (!parsed.hours.includes(cursor.getHours())) {
      cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
      continue;
    }
    if (parsed.minutes.includes(cursor.getMinutes())) {
      out.push(new Date(cursor.getTime()));
    }
    cursor.setMinutes(cursor.getMinutes() + 1);
  }

  return out;
}

/** The month and day half of a match, which is what a day can be skipped on. */
function dateMatches(parsed: CronParsed, at: Date): boolean {
  if (!parsed.months.includes(at.getMonth() + 1)) return false;

  const domHit = parsed.daysOfMonth.includes(at.getDate());
  const dowHit = parsed.daysOfWeek.includes(at.getDay());

  if (parsed.domRestricted && parsed.dowRestricted) return domHit || dowHit;
  return domHit && dowHit;
}

/** Does this expression fire at this minute? */
export function matches(parsed: CronParsed, at: Date): boolean {
  if (!parsed.minutes.includes(at.getMinutes())) return false;
  if (!parsed.hours.includes(at.getHours())) return false;
  return dateMatches(parsed, at);
}
