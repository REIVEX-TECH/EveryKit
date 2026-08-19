"use client";

import { useId, useMemo, useState } from "react";
import {
  BACKGROUND_LABEL,
  specSizeLabel,
  specTitle,
  specs,
  type PhotoSpec,
} from "@/data/specs";

type Props = {
  spec: PhotoSpec;
  onChange: (spec: PhotoSpec) => void;
};

/**
 * A filterable list rather than a plain select: sixteen entries is enough that
 * typing "uk" beats scrolling, and a native select cannot be searched on a
 * phone.
 */
export function SpecPicker({ spec, onChange }: Props) {
  const [query, setQuery] = useState("");
  const listId = useId();
  const selectId = useId();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return specs;
    return specs.filter((s) =>
      `${s.country} ${s.document} ${s.countryCode} ${specSizeLabel(s)}`
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start">
      <div>
        <label htmlFor={selectId} className="block text-[14px] font-semibold text-foreground">
          Which document is this for
        </label>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search country or size"
          aria-label="Search countries and documents"
          aria-controls={listId}
          className="mt-2 w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />

        <select
          id={selectId}
          value={matches.some((s) => s.slug === spec.slug) ? spec.slug : ""}
          size={Math.min(6, Math.max(2, matches.length))}
          onChange={(event) => {
            const next = specs.find((s) => s.slug === event.target.value);
            if (next) onChange(next);
          }}
          className="mt-2 w-full rounded-[10px] border border-line bg-background px-1 py-1 text-[15px] outline-none focus:border-primary"
        >
          {matches.length === 0 ? (
            <option value="" disabled>
              Nothing matches that
            </option>
          ) : (
            matches.map((s) => (
              <option key={s.slug} value={s.slug} className="rounded-[6px] px-2 py-1.5">
                {specTitle(s)}, {specSizeLabel(s)}
              </option>
            ))
          )}
        </select>

        <p id={listId} className="sr-only" aria-live="polite">
          {matches.length} of {specs.length} documents shown
        </p>
      </div>

      <SpecSummary spec={spec} />
    </div>
  );
}

export function SpecSummary({ spec }: { spec: PhotoSpec }) {
  return (
    <dl className="ek-card grid grid-cols-2 gap-x-6 gap-y-3 bg-bg-soft p-4 text-[13px] sm:w-[260px] sm:grid-cols-1">
      <Row label="Size" value={specSizeLabel(spec)} />
      <Row label="Pixels" value={`${spec.pixelWidth} x ${spec.pixelHeight}`} />
      <Row label="Resolution" value={`${spec.dpi} DPI`} />
      <Row
        label="Head height"
        value={
          spec.headMinMm !== undefined && spec.headMaxMm !== undefined
            ? `${spec.headMinMm} to ${spec.headMaxMm} mm`
            : "Not published"
        }
      />
      <Row label="Background" value={BACKGROUND_LABEL[spec.background]} />
    </dl>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="sm:flex sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-text-light">{label}</dt>
      <dd className="m-0 font-semibold text-foreground sm:text-right">{value}</dd>
    </div>
  );
}
