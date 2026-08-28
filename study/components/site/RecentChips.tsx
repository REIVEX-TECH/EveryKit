"use client";

import { useCallback, useEffect, useState } from "react";
import { addRecent, clearRecent, loadRecent, type RecentEntry } from "@/lib/recent";

/**
 * The Recent list as a hook plus a small chip row.
 *
 * The hook starts empty and loads from storage in an effect, so the server and
 * the first client render agree (nothing) and there is no hydration mismatch.
 * A tool calls `remember` when a result is taken, and passes `items` and the
 * pick handler to the chip row.
 */
export function useRecent(key: string) {
  const [items, setItems] = useState<RecentEntry[]>([]);

  useEffect(() => {
    setItems(loadRecent(key));
  }, [key]);

  const remember = useCallback(
    (value: string, label?: string) => {
      setItems(addRecent(key, value, label));
    },
    [key],
  );

  const clear = useCallback(() => {
    clearRecent(key);
    setItems([]);
  }, [key]);

  return { items, remember, clear };
}

export function RecentChips({
  items,
  onPick,
  onClear,
  label = "Recent",
}: {
  items: RecentEntry[];
  onPick: (entry: RecentEntry) => void;
  onClear: () => void;
  label?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-[12px] border border-line bg-bg-soft p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-semibold text-text-light">
          {label} <span className="font-normal">(this device only)</span>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="rounded-[6px] px-1.5 py-0.5 text-[12px] text-text-light underline underline-offset-2 hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((entry, i) => (
          <button
            key={`${entry.v}-${i}`}
            type="button"
            onClick={() => onPick(entry)}
            title={entry.label}
            className="max-w-[240px] truncate rounded-full border border-line bg-background px-3 py-1 text-left text-[13px] text-text-light hover:border-line-strong hover:text-foreground"
          >
            {entry.label}
          </button>
        ))}
      </div>
    </div>
  );
}
