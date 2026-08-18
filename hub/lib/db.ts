import { Pool } from "pg";

/**
 * One pool per warm serverless instance.
 *
 * Vercel functions freeze and thaw, so a module-level pool is reused across
 * invocations on the same instance rather than opening a connection per
 * request. `max: 1` because each invocation handles one request and a pooled
 * Neon endpoint does the real multiplexing — a larger pool here just holds
 * connections open that nothing is using.
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
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
      // Hosted Postgres is TLS; a local container is not.
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
