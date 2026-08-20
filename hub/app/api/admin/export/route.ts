import { getPool } from "@/lib/db";
import { csvRow } from "@/lib/admin/format";

/**
 * The whole email list as a CSV.
 *
 * Streamed in pages rather than gathered into one string, so the response
 * starts moving on the first page and the server never holds the entire table
 * in memory. It is behind the same session as everything else under
 * /api/admin: the middleware answers 401 without one, and this file assumes
 * that has already happened.
 *
 * Paging by id rather than OFFSET, because a row inserted while the export runs
 * shifts every offset after it and quietly duplicates or drops a row.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Rows per query. Small enough to stream, large enough not to chatter. */
const PAGE = 500;

const COLUMNS = ["email", "first_kit", "created_at", "last_seen_at", "hits"];

export async function GET(): Promise<Response> {
  const pool = getPool();
  if (!pool) {
    return new Response("The database is not configured on this server.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  const encoder = new TextEncoder();
  let after = 0;

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(csvRow(COLUMNS)));
    },
    async pull(controller) {
      try {
        const page = await pool.query(
          `SELECT id,
                  email,
                  first_kit,
                  to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS created_at,
                  to_char(last_seen_at, 'YYYY-MM-DD"T"HH24:MI:SSOF') AS last_seen_at,
                  hits
             FROM emails
            WHERE id > $1
            ORDER BY id
            LIMIT $2`,
          [after, PAGE],
        );

        for (const row of page.rows) {
          after = Number(row.id);
          controller.enqueue(
            encoder.encode(
              csvRow([row.email, row.first_kit, row.created_at, row.last_seen_at, row.hits]),
            ),
          );
        }

        if (page.rows.length < PAGE) controller.close();
      } catch (error) {
        console.error("admin export: could not read the emails table", error);
        controller.error(error);
      }
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="everykit-emails-${stamp}.csv"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
