"use client";

import { useEffect, useRef, useState } from "react";
import { ALGORITHM_LABELS, hashFile, hashText, matchesDigest, type Algorithm, type Digests } from "@/lib/dev/hash";
import { CopyButton, Input, Note, TextBox } from "./ui";
import { RecentChips, useRecent } from "@/components/site/RecentChips";

/**
 * All three digests at once, of text or of a file.
 *
 * Three together rather than one at a time because the usual reason to be here
 * is checking a download against a published checksum, and the page that
 * published it rarely says which algorithm it used. Paste the checksum in and
 * the tool says which one it is, or that it is none of them.
 */
export function HashTool() {
  const [source, setSource] = useState<"text" | "file">("text");
  const [text, setText] = useState("");
  const [digests, setDigests] = useState<Digests | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState("");
  const picker = useRef<HTMLInputElement>(null);
  const recent = useRecent("dev-hash");

  // Text hashes as it is typed. The digest of a few kilobytes is microseconds,
  // so there is nothing to debounce and nothing to put in a worker.
  useEffect(() => {
    if (source !== "text") return;
    let live = true;
    if (text === "") {
      setDigests(null);
      return;
    }
    void hashText(text).then((result) => {
      if (live) setDigests(result);
    });
    return () => {
      live = false;
    };
  }, [text, source]);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setProgress(0);
    setFileName(file.name);
    try {
      setDigests(await hashFile(file, setProgress));
    } catch {
      setDigests(null);
      setError("That file could not be read.");
    } finally {
      setBusy(false);
    }
  }

  const matched = digests ? matchesDigest(digests, candidate) : null;
  const pill = (active: boolean) =>
    `rounded-full px-4 py-2 text-[14px] font-semibold ${
      active ? "bg-primary-dark text-white" : "border border-line bg-background hover:border-line-strong"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-[14px] font-semibold">What to hash</legend>
        <div className="mt-2 flex gap-2">
          {(["text", "file"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={source === value}
              onClick={() => {
                setSource(value);
                setDigests(null);
                setError(null);
                setFileName(null);
              }}
              className={pill(source === value)}
            >
              {value === "text" ? "Text" : "A file"}
            </button>
          ))}
        </div>
      </fieldset>

      {source === "text" ? (
        <div>
          <label htmlFor="hash-in" className="block text-[14px] font-semibold">
            Text
          </label>
          <TextBox
            id="hash-in"
            value={text}
            onChange={(event) => setText(event.target.value)}
            onBlur={() => {
              if (text.trim() !== "" && digests) recent.remember(text);
            }}
            placeholder="Type or paste. The digests update as you go."
            className="mt-2 min-h-[160px]"
          />
          <p className="mt-1.5 text-[13px] text-text-light">
            Hashed as UTF-8, so text in any language gives the same answer any other correct tool
            would.
          </p>
          <div className="mt-3">
            <RecentChips items={recent.items} onClear={recent.clear} onPick={(entry) => setText(entry.v)} />
          </div>
        </div>
      ) : (
        <div className="ek-card flex flex-col items-start gap-3 p-4">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            className="ek-btn ek-btn-accent"
            disabled={busy}
          >
            {busy ? `Reading, ${Math.round(progress * 100)}%` : "Choose a file"}
          </button>
          <input
            ref={picker}
            type="file"
            aria-label="Choose a file to hash"
            className="sr-only"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) void onFile(picked);
              event.target.value = "";
            }}
          />
          <p className="text-[13px] text-text-light">
            Read in slices in this page. Nothing is uploaded, and a large file is not held in
            memory whole for the MD5.
          </p>
          {fileName ? <p className="text-[14px]">{fileName}</p> : null}
        </div>
      )}

      {error ? <Note tone="bad">{error}</Note> : null}

      <div className="ek-card divide-y divide-line">
        {(Object.keys(ALGORITHM_LABELS) as Algorithm[]).map((algorithm) => (
          <div key={algorithm} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
            <span className="w-20 shrink-0 text-[13px] font-semibold">
              {ALGORITHM_LABELS[algorithm]}
            </span>
            <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-text-light">
              {digests ? digests[algorithm] : "waiting for something to hash"}
            </code>
            {digests ? (
              <CopyButton
                text={digests[algorithm]}
                label="Copy"
                className="ek-btn ek-btn-quiet shrink-0 px-3 py-1.5 text-[13px]"
              />
            ) : null}
          </div>
        ))}
      </div>

      <div>
        <label htmlFor="hash-check" className="block text-[14px] font-semibold">
          Compare with a published checksum
        </label>
        <Input
          id="hash-check"
          value={candidate}
          onChange={(event) => setCandidate(event.target.value)}
          placeholder="Paste the checksum you were given"
          className="mt-2 font-mono text-[13px]"
        />
        {candidate.trim() !== "" && digests ? (
          matched ? (
            <p className="mt-2 flex items-center gap-2 text-[14px]">
              <Tick />
              That is the {ALGORITHM_LABELS[matched]} of this {source === "file" ? "file" : "text"}.
            </p>
          ) : (
            <Note tone="bad">That does not match any of the three above.</Note>
          )
        ) : null}
      </div>
    </div>
  );
}

/** The success token as a mark rather than as text, where its contrast is fine. */
function Tick() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path
        d="M4 10.5l4 4 8-9"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
