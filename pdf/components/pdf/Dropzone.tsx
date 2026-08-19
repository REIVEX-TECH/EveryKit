"use client";

import { useId, useRef, useState } from "react";
import { FilePlus2 } from "lucide-react";
import { readPicked, type PickedFile } from "@/lib/pdf/files";

type Props = {
  accept: string;
  multiple: boolean;
  onFiles: (files: PickedFile[]) => void;
  /** Shown inside the zone. */
  label: string;
  hint?: string;
  /** Compact form, used once files are already chosen. */
  compact?: boolean;
};

/**
 * The one place a file enters the app.
 *
 * It is a real <input type="file"> with a label wrapped round it rather than a
 * div with a click handler, which is what makes it reachable by keyboard and
 * announced properly - the drag-and-drop is the addition, not the mechanism.
 */
export function Dropzone({ accept, multiple, onFiles, label, hint, compact }: Props) {
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const accepted = accept.split(",").map((type) => type.trim());

  async function take(list: FileList | null) {
    if (!list || list.length === 0) return;

    const files = Array.from(list);
    const good = files.filter((file) => accepted.includes(file.type));
    const bad = files.length - good.length;

    setRejected(
      bad === 0
        ? null
        : bad === files.length
          ? `That is not a file this tool can open. It takes ${describeAccept(accepted)}.`
          : `${bad} of those were not ${describeAccept(accepted)}, so they were left out.`,
    );

    if (good.length === 0) return;
    onFiles(await Promise.all(good.map(readPicked)));

    // Let the same file be picked twice in a row, which otherwise silently
    // does nothing because the input's value has not changed.
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          void take(event.dataTransfer.files);
        }}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed text-center transition-colors",
          compact ? "gap-1 px-4 py-5" : "gap-2 px-6 py-10",
          over ? "border-accent bg-accent/5" : "border-line-strong bg-bg-soft hover:bg-background",
        ].join(" ")}
      >
        <FilePlus2
          aria-hidden="true"
          className={compact ? "h-5 w-5 text-text-light" : "h-7 w-7 text-text-light"}
        />
        <span className={compact ? "text-[14px] font-semibold" : "text-[16px] font-semibold"}>
          {label}
        </span>
        {hint ? <span className="text-[13px] text-text-light">{hint}</span> : null}
      </label>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => void take(event.target.files)}
      />

      {rejected ? (
        <p role="status" className="mt-2 text-[13px] text-warn">
          {rejected}
        </p>
      ) : null}
    </div>
  );
}

function describeAccept(types: string[]): string {
  if (types.length === 1 && types[0] === "application/pdf") return "a PDF";
  return "JPG, PNG or WebP images";
}
