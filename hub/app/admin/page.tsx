import type { Metadata } from "next";
import { relativeTime } from "@/lib/admin/format";
import {
  SIGNUP_DAYS,
  TRAFFIC_DAYS,
  loadDashboard,
  type Count,
  type DayCount,
  type FunnelRow,
} from "@/lib/admin/stats";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

/**
 * The dashboard.
 *
 * Server rendered end to end. Every figure on this page came out of a query in
 * `lib/admin/stats.ts` and was turned into text before it left the server, so
 * there is no client bundle here holding a copy of the email list and nothing
 * to hydrate. The bars are divs with a width, because a chart library for six
 * horizontal bars is a megabyte to avoid writing `style={{ width }}`.
 *
 * It is denser than the rest of EveryKit on purpose. One person reads it, and
 * they would rather see everything at once than scroll through whitespace.
 */
export default async function AdminDashboard() {
  const data = await loadDashboard();

  if (!data) {
    return (
      <div className="ek-shell max-w-[720px] py-16">
        <h1 className="text-[28px]">Dashboard</h1>
        <p className="mt-3 text-[16px] text-text-light">
          There is no DATABASE_URL set on this server, so there is nothing to read. Add it
          to .env.production and reload PM2 with --update-env.
        </p>
        <LogOut />
      </div>
    );
  }

  const { overview, signupsByKit, signupsPerDay, viewsByKit, pagesByPath, funnel, countingSince, recent } =
    data;
  const now = Date.now();

  return (
    <div className="ek-shell py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-[26px]">Dashboard</h1>
        <LogOut />
      </div>

      <section className="mt-6">
        <h2 className="sr-only">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Card label="Emails, all time" value={overview.emailsTotal} />
          <Card label="New today" value={overview.emailsToday} />
          <Card label="New this 7 days" value={overview.emailsWeek} />
          <Card label="Came back" value={overview.emailsReturning} note="more than one visit" />
          <Card label="Views today" value={overview.viewsToday} />
          <Card label="Views this 7 days" value={overview.viewsWeek} />
          <Card
            label="Not found today"
            value={overview.notFoundToday}
            note="bot probes and 404s"
          />
          <Card
            label="Not found this 7 days"
            value={overview.notFoundWeek}
            note="caught, kept out of views"
          />
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-[18px]">Signups by kit</h2>
          <Bars rows={signupsByKit} empty="No signups yet." />
        </section>

        <section>
          <h2 className="text-[18px]">Traffic by kit</h2>
          <p className="mt-1 text-[13px] text-text-light">
            Last {TRAFFIC_DAYS} days.{" "}
            {countingSince
              ? `Counting since ${countingSince}.`
              : "Counting starts at the first page view after this deploys, so zero here is expected today."}
          </p>
          <Bars rows={viewsByKit} empty="Nothing counted yet." />
        </section>
      </div>

      <section className="mt-8">
        <h2 className="text-[18px]">Traffic by page</h2>
        <p className="mt-1 text-[13px] text-text-light">
          Last {TRAFFIC_DAYS} days. The hub&apos;s own pages, split by path, so landings like
          /from-lgu show on their own instead of folded into the hub total above.
        </p>
        <Bars rows={pagesByPath} empty="No hub pages counted yet." />
      </section>

      <section className="mt-8">
        <h2 className="text-[18px]">Conversion funnel by kit</h2>
        <p className="mt-1 text-[13px] text-text-light">
          Last {TRAFFIC_DAYS} days. Opened is a tool view, completed is a result taken, then the
          email choice. Opened and completed are instrumented on the busier kits so far; email
          submit and skip are counted everywhere.
        </p>
        <Funnel rows={funnel} />
      </section>

      <section className="mt-8">
        <h2 className="text-[18px]">Signups per day</h2>
        <p className="mt-1 text-[13px] text-text-light">Last {SIGNUP_DAYS} days.</p>
        <Columns rows={signupsPerDay} />
      </section>

      <section className="mt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-[18px]">Recent signups</h2>
          <a
            href="/api/admin/export"
            className="ek-btn ek-btn-quiet px-4 py-2 text-[14px] no-underline"
            download
          >
            Export the full list as CSV
          </a>
        </div>

        {recent.length === 0 ? (
          <p className="mt-3 text-[14px] text-text-light">Nobody has signed up yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-text-light">
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Kit</th>
                  <th className="py-2 pr-3 font-semibold">First seen</th>
                  <th className="py-2 pr-3 font-semibold">Last seen</th>
                  <th className="py-2 pr-3 text-right font-semibold">Visits</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.email} className="border-b border-line">
                    <td className="py-1.5 pr-3">{row.email}</td>
                    <td className="py-1.5 pr-3 text-text-light">{row.firstKit}</td>
                    <td className="py-1.5 pr-3 text-text-light">{row.createdAt}</td>
                    <td className="py-1.5 pr-3 text-text-light">
                      {relativeTime(row.lastSeenAt, now)}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{row.hits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-3 text-[13px] text-text-light">
          The 50 most recent. The CSV has all of them.
        </p>
      </section>
    </div>
  );
}

function LogOut() {
  return (
    <form method="post" action="/api/admin/logout">
      <button type="submit" className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]">
        Log out
      </button>
    </form>
  );
}

function Card({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="ek-card px-4 py-3">
      <p className="text-[13px] text-text-light">{label}</p>
      <p className="mt-1 text-[26px] font-semibold tabular-nums">{value.toLocaleString("en")}</p>
      {note ? <p className="text-[12px] text-text-light">{note}</p> : null}
    </div>
  );
}

/** A horizontal bar per row, widths relative to the largest. */
function Bars({ rows, empty }: { rows: Count[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="mt-3 text-[14px] text-text-light">{empty}</p>;
  }
  const largest = Math.max(...rows.map((row) => row.count), 1);

  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 text-[13px]">{row.label}</span>
          <span className="h-4 flex-1 rounded-[4px] bg-bg-soft">
            <span
              className="block h-4 rounded-[4px] bg-primary-dark"
              style={{ width: `${Math.max(2, (row.count / largest) * 100)}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-[13px] tabular-nums">
            {row.count.toLocaleString("en")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The funnel table: opened, completed, submit, skip per kit, with a rate. */
function Funnel({ rows }: { rows: FunnelRow[] }) {
  if (rows.length === 0) {
    return <p className="mt-3 text-[14px] text-text-light">No events counted yet.</p>;
  }
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line text-left text-text-light">
            <th className="py-2 pr-3 font-semibold">Kit</th>
            <th className="py-2 pr-3 text-right font-semibold">Opened</th>
            <th className="py-2 pr-3 text-right font-semibold">Completed</th>
            <th className="py-2 pr-3 text-right font-semibold">Done rate</th>
            <th className="py-2 pr-3 text-right font-semibold">Email given</th>
            <th className="py-2 pr-3 text-right font-semibold">Skipped</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rate = row.opened > 0 ? Math.round((row.completed / row.opened) * 100) : null;
            return (
              <tr key={row.kit} className="border-b border-line">
                <td className="py-1.5 pr-3 font-semibold">{row.kit}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{row.opened.toLocaleString("en")}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{row.completed.toLocaleString("en")}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums text-text-light">
                  {rate === null ? "" : `${rate}%`}
                </td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{row.submit.toLocaleString("en")}</td>
                <td className="py-1.5 pr-3 text-right tabular-nums">{row.skip.toLocaleString("en")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** A column per day, oldest on the left. */
function Columns({ rows }: { rows: DayCount[] }) {
  const largest = Math.max(...rows.map((row) => row.count), 1);

  return (
    <ol className="mt-3 flex h-28 items-end gap-1.5">
      {rows.map((row) => (
        <li key={row.day} className="flex h-full flex-1 flex-col justify-end gap-1">
          <span className="text-center text-[11px] tabular-nums text-text-light">
            {row.count > 0 ? row.count : ""}
          </span>
          <span
            title={`${row.day}: ${row.count}`}
            className="block w-full rounded-t-[3px] bg-primary-dark"
            style={{ height: `${Math.max(2, (row.count / largest) * 100)}%` }}
          />
          <span className="text-center text-[10px] text-text-light">{row.day.slice(5)}</span>
        </li>
      ))}
    </ol>
  );
}
