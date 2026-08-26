"use client";

import { useState } from "react";
import { Shuffle } from "lucide-react";
import { intoGroups, intoGroupsOfSize } from "@/lib/teach/groups";
import { parseRoster, shuffle } from "@/lib/teach/roster";
import { CopyButton, Field, Input, Note, Select, TextBox } from "./ui";

export function GroupsTool() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"count" | "size">("count");
  const [n, setN] = useState(4);
  const [balanced, setBalanced] = useState(true);
  const [groups, setGroups] = useState<string[][] | null>(null);

  function make() {
    const roster = shuffle(parseRoster(text));
    if (roster.length === 0) {
      setGroups(null);
      return;
    }
    setGroups(mode === "count" ? intoGroups(roster, n, balanced) : intoGroupsOfSize(roster, n, balanced));
  }

  const asText = () =>
    (groups ?? [])
      .map((g, i) => `Group ${i + 1}\n${g.map((name) => `  ${name}`).join("\n")}`)
      .join("\n\n");

  return (
    <div className="flex flex-col gap-4">
      <Field label="Your class list" htmlFor="roster" note="One name a line.">
        <TextBox
          id="roster"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Ada Lovelace\nGrace Hopper\nAlan Turing"}
          className="min-h-[140px]"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Split by" htmlFor="mode">
          <Select id="mode" value={mode} onChange={(e) => setMode(e.target.value as "count" | "size")}>
            <option value="count">A number of groups</option>
            <option value="size">Groups of a size</option>
          </Select>
        </Field>
        <Field label={mode === "count" ? "How many groups" : "Students per group"} htmlFor="n">
          <Input
            id="n"
            type="number"
            min={1}
            max={100}
            value={n}
            onChange={(e) => setN(Math.max(1, Number.parseInt(e.target.value, 10) || 1))}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={balanced}
          onChange={(e) => setBalanced(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        Even sizes (spread any remainder rather than leaving one group short)
      </label>

      <div>
        <button type="button" onClick={make} className="ek-btn ek-btn-accent">
          <Shuffle aria-hidden="true" className="h-4 w-4" />
          Make groups
        </button>
      </div>

      {groups ? (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <div key={i} className="ek-card p-3">
                <div className="text-[13px] font-semibold text-text-light">
                  Group {i + 1} · {g.length}
                </div>
                <ul className="mt-1 flex flex-col gap-0.5 text-[15px]">
                  {g.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div>
            <CopyButton text={asText} label="Copy the groups" />
          </div>
        </div>
      ) : null}

      <Note tone="quiet">
        The list stays in your browser and is not uploaded. Shuffle again for a fresh split.
      </Note>
    </div>
  );
}
