"use client";

import { useMemo, useState } from "react";
import { format, type SqlLanguage } from "sql-formatter";
import { CopyButton, Field, Note, Select, TextBox } from "./ui";

const DIALECTS: Array<{ id: SqlLanguage; label: string }> = [
  { id: "sql", label: "Standard SQL" },
  { id: "postgresql", label: "PostgreSQL" },
  { id: "mysql", label: "MySQL" },
  { id: "mariadb", label: "MariaDB" },
  { id: "sqlite", label: "SQLite" },
  { id: "transactsql", label: "SQL Server (T-SQL)" },
  { id: "bigquery", label: "BigQuery" },
  { id: "snowflake", label: "Snowflake" },
  { id: "plsql", label: "Oracle PL/SQL" },
];

const SAMPLE = "select id, name, email from users u join orders o on o.user_id = u.id where u.active = true and o.total > 100 order by o.total desc;";

/** Collapse whitespace outside quoted strings, for the one-line minify. */
function minifySql(sql: string): string {
  let out = "";
  let quote: string | null = null;
  let prevSpace = false;
  for (let i = 0; i < sql.length; i += 1) {
    const c = sql[i];
    if (quote) {
      out += c;
      if (c === quote && sql[i - 1] !== "\\") quote = null;
      prevSpace = false;
    } else if (c === "'" || c === '"' || c === "`") {
      quote = c;
      out += c;
      prevSpace = false;
    } else if (/\s/.test(c)) {
      if (!prevSpace) {
        out += " ";
        prevSpace = true;
      }
    } else {
      out += c;
      prevSpace = false;
    }
  }
  return out.trim();
}

export function SqlFormatterTool() {
  const [input, setInput] = useState(SAMPLE);
  const [dialect, setDialect] = useState<SqlLanguage>("sql");
  const [minify, setMinify] = useState(false);

  const result = useMemo(() => {
    if (input.trim() === "") return { output: "" };
    try {
      const formatted = format(input, { language: dialect });
      return { output: minify ? minifySql(formatted) : formatted };
    } catch (e) {
      return { error: e instanceof Error ? e.message : String(e) };
    }
  }, [input, dialect, minify]);

  const output = "output" in result ? result.output : "";
  const error = "error" in result ? result.error : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Dialect" htmlFor="dialect">
          <Select id="dialect" value={dialect} onChange={(e) => setDialect(e.target.value as SqlLanguage)} className="w-56">
            {DIALECTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-[14px]">
          <input type="checkbox" checked={minify} onChange={(e) => setMinify(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
          Minify to one line
        </label>
      </div>

      <Field label="SQL" htmlFor="input">
        <TextBox id="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste your SQL" />
      </Field>

      {error ? <Note tone="bad">{error}</Note> : null}

      {output ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[14px] font-semibold">Formatted</span>
            <CopyButton text={() => output} />
          </div>
          <TextBox readOnly value={output} aria-label="Formatted SQL" />
        </div>
      ) : null}

      <Note tone="quiet">Formatted in your browser with sql-formatter. It changes only the layout, never what the query does, and nothing is sent anywhere.</Note>
    </div>
  );
}
