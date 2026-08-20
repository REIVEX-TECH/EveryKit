import { Pool } from "pg";

/**
 * One pool for the process.
 *
 * This runs as a long-lived Node server under PM2, not a serverless function,
 * so the pool is created once and lives as long as the process. It was capped
 * at a single connection when this was destined for Vercel, where each
 * invocation handled one request and a pooled endpoint did the multiplexing —
 * here that cap would serialise every concurrent signup behind one connection.
 *
 * Ten is comfortable against Postgres's default 100 while leaving room for
 * psql and anything else on the box.
 */
declare global {
  var __everykitPool: Pool | undefined;
}

export function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  if (!globalThis.__everykitPool) {
    globalThis.__everykitPool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      // Postgres is on this same machine over the loopback interface, so
      // there is no TLS to negotiate. A remote database would need it.
      ssl: /localhost|127\.0\.0\.1/.test(connectionString)
        ? undefined
        : { rejectUnauthorized: false },
    });
  }
  return globalThis.__everykitPool;
}

/**
 * Record an address. Re-submitting a known one bumps its counters rather than
 * failing, which is what lets the endpoint answer identically either way.
 */
export async function recordEmail(email: string, kit: string): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");
  await pool.query(
    `INSERT INTO emails (email, first_kit)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE
       SET last_seen_at = now(),
           hits = emails.hits + 1`,
    [email, kit],
  );
}

/**
 * Count one page view.
 *
 * The whole write is an increment of one integer on one row keyed by
 * (day, kit, path). Nothing about the request reaches this function: it takes
 * two validated strings and there is no third parameter for a caller to start
 * passing an address into.
 *
 * `current_date` is Postgres's, so a day boundary is the database's one rather
 * than the visitor's, which is what makes two rows for the same day impossible.
 */
export async function recordPageview(kit: string, path: string): Promise<void> {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set");
  await pool.query(
    `INSERT INTO pageviews (day, kit, path, count)
     VALUES (current_date, $1, $2, 1)
     ON CONFLICT (day, kit, path) DO UPDATE
       SET count = pageviews.count + 1`,
    [kit, path],
  );
}
