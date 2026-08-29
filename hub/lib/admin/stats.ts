import { getPool } from "@/lib/db";

/**
 * Everything the dashboard shows, read in one place.
 *
 * All of it runs on the server and none of it is serialised into client
 * JavaScript beyond the numbers and the rows that are actually drawn. Dates are
 * cast to text in SQL rather than parsed into JS Date objects and formatted
 * back: the database knows what day it is in its own timezone, and a round trip
 * through the server's timezone is how a row lands on the wrong day.
 */

export type Overview = {
  emailsTotal: number;
  emailsToday: number;
  emailsWeek: number;
  emailsReturning: number;
  viewsToday: number;
  viewsWeek: number;
  /** Hits bucketed to /_event/not-found: bot probes and 404s the counter caught. */
  notFoundToday: number;
  notFoundWeek: number;
};

export type Count = { label: string; count: number };
export type DayCount = { day: string; count: number };
export type FunnelRow = {
  kit: string;
  opened: number;
  completed: number;
  submit: number;
  skip: number;
};

export type Signup = {
  email: string;
  firstKit: string;
  createdAt: string;
  lastSeenAt: string;
  hits: number;
};

export type Dashboard = {
  overview: Overview;
  signupsByKit: Count[];
  signupsPerDay: DayCount[];
  viewsByKit: Count[];
  /** Hub-served pages broken out by path, so /from-lgu and /about show on their own. */
  pagesByPath: Count[];
  funnel: FunnelRow[];
  countingSince: string | null;
  recent: Signup[];
};

/**
 * The reserved namespace for our own events. Page views must exclude it, so the
 * traffic numbers count pages a person saw and nothing we fired ourselves. The
 * underscore is escaped because it is a wildcard in LIKE.
 */
const NOT_EVENT = "path NOT LIKE '/\\_event/%' ESCAPE '\\'";
const IS_EVENT = "path LIKE '/\\_event/%' ESCAPE '\\'";

/** How many days the two histories cover. */
export const SIGNUP_DAYS = 14;
export const TRAFFIC_DAYS = 7;

function toNumber(value: unknown): number {
  // count() and sum() come back as strings from pg, because bigint does not fit
  // in a JS number in general. These are page counts; they fit.
  return typeof value === "number" ? value : Number(value ?? 0);
}

/**
 * Fill in the days nothing happened.
 *
 * A bar chart with gaps where the quiet days were is a chart that lies about
 * its own shape, and a run of zeroes is information.
 */
function fillDays(rows: DayCount[], days: number, today: string): DayCount[] {
  const found = new Map(rows.map((row) => [row.day, row.count]));
  const end = new Date(`${today}T00:00:00Z`);
  const out: DayCount[] = [];
  for (let back = days - 1; back >= 0; back--) {
    const at = new Date(end.getTime() - back * 86_400_000);
    const day = at.toISOString().slice(0, 10);
    out.push({ day, count: found.get(day) ?? 0 });
  }
  return out;
}

export async function loadDashboard(): Promise<Dashboard | null> {
  const pool = getPool();
  if (!pool) return null;

  const overview = await pool.query(
    `SELECT
       (SELECT count(*) FROM emails) AS emails_total,
       (SELECT count(*) FROM emails WHERE created_at >= current_date) AS emails_today,
       (SELECT count(*) FROM emails WHERE created_at >= current_date - 6) AS emails_week,
       (SELECT count(*) FROM emails WHERE hits > 1) AS emails_returning,
       (SELECT coalesce(sum(count), 0) FROM pageviews WHERE day = current_date AND ${NOT_EVENT}) AS views_today,
       (SELECT coalesce(sum(count), 0) FROM pageviews WHERE day >= current_date - 6 AND ${NOT_EVENT}) AS views_week,
       (SELECT coalesce(sum(count), 0) FROM pageviews WHERE path = '/_event/not-found' AND day = current_date) AS not_found_today,
       (SELECT coalesce(sum(count), 0) FROM pageviews WHERE path = '/_event/not-found' AND day >= current_date - 6) AS not_found_week,
       to_char(current_date, 'YYYY-MM-DD') AS today,
       (SELECT to_char(min(day), 'YYYY-MM-DD') FROM pageviews) AS counting_since`,
  );
  const totals = overview.rows[0];

  const byKit = await pool.query(
    `SELECT first_kit, count(*) AS count
       FROM emails
      GROUP BY first_kit
      ORDER BY count DESC, first_kit`,
  );

  const perDay = await pool.query(
    `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, count(*) AS count
       FROM emails
      WHERE created_at >= current_date - $1::int
      GROUP BY 1
      ORDER BY 1`,
    [SIGNUP_DAYS - 1],
  );

  const traffic = await pool.query(
    `SELECT kit, sum(count) AS count
       FROM pageviews
      WHERE day >= current_date - $1::int AND ${NOT_EVENT}
      GROUP BY kit
      ORDER BY count DESC, kit`,
    [TRAFFIC_DAYS - 1],
  );

  // The hub's own pages, broken out by path. "Traffic by kit" sums every hub
  // page into one bucket, which hides landings like /from-lgu and /about; this
  // splits them back apart. Only the hub is stored path-by-path here (kits post
  // their own slug), so the kit filter keeps the rows meaningful.
  const pages = await pool.query(
    `SELECT path, sum(count) AS count
       FROM pageviews
      WHERE kit = 'hub' AND day >= current_date - $1::int AND ${NOT_EVENT}
      GROUP BY path
      ORDER BY count DESC, path`,
    [TRAFFIC_DAYS - 1],
  );

  // The conversion funnel: our own events, per kit, over the traffic window.
  const funnel = await pool.query(
    `SELECT kit,
            coalesce(sum(count) FILTER (WHERE path = '/_event/tool-opened'), 0) AS opened,
            coalesce(sum(count) FILTER (WHERE path = '/_event/tool-completed'), 0) AS completed,
            coalesce(sum(count) FILTER (WHERE path = '/_event/email-submit'), 0) AS submit,
            coalesce(sum(count) FILTER (WHERE path = '/_event/email-skip'), 0) AS skip
       FROM pageviews
      WHERE day >= current_date - $1::int AND ${IS_EVENT}
      GROUP BY kit
      ORDER BY completed DESC, opened DESC, kit`,
    [TRAFFIC_DAYS - 1],
  );

  const recent = await pool.query(
    `SELECT email,
            first_kit,
            to_char(created_at, 'YYYY-MM-DD HH24:MI') AS created_at,
            last_seen_at,
            hits
       FROM emails
      ORDER BY created_at DESC
      LIMIT 50`,
  );

  return {
    overview: {
      emailsTotal: toNumber(totals.emails_total),
      emailsToday: toNumber(totals.emails_today),
      emailsWeek: toNumber(totals.emails_week),
      emailsReturning: toNumber(totals.emails_returning),
      viewsToday: toNumber(totals.views_today),
      viewsWeek: toNumber(totals.views_week),
      notFoundToday: toNumber(totals.not_found_today),
      notFoundWeek: toNumber(totals.not_found_week),
    },
    signupsByKit: byKit.rows.map((row) => ({
      label: String(row.first_kit),
      count: toNumber(row.count),
    })),
    signupsPerDay: fillDays(
      perDay.rows.map((row) => ({ day: String(row.day), count: toNumber(row.count) })),
      SIGNUP_DAYS,
      String(totals.today),
    ),
    viewsByKit: traffic.rows.map((row) => ({
      label: String(row.kit),
      count: toNumber(row.count),
    })),
    pagesByPath: pages.rows.map((row) => ({
      label: String(row.path),
      count: toNumber(row.count),
    })),
    funnel: funnel.rows.map((row) => ({
      kit: String(row.kit),
      opened: toNumber(row.opened),
      completed: toNumber(row.completed),
      submit: toNumber(row.submit),
      skip: toNumber(row.skip),
    })),
    countingSince: totals.counting_since ? String(totals.counting_since) : null,
    recent: recent.rows.map((row) => ({
      email: String(row.email),
      firstKit: String(row.first_kit),
      createdAt: String(row.created_at),
      lastSeenAt: new Date(row.last_seen_at).toISOString(),
      hits: toNumber(row.hits),
    })),
  };
}
