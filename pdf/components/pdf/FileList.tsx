"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { formatBytes, type PickedFile } from "@/lib/pdf/files";

type Props = {
  files: PickedFile[];
  onChange: (files: PickedFile[]) => void;
  /** Off for tools that take exactly one file. */
  reorderable?: boolean;
};

/**
 * The chosen files, in the order they will be used.
 *
 * Reordering is done with buttons rather than drag-and-drop. Dragging is nicer
 * with a mouse, but it is the only interaction here that decides the output,
 * and a control that cannot be reached from a keyboard or used reliably on a
 * touchscreen is not one to hang the result on.
 */
export function FileList({ files, onChange, reorderable = true }: Props) {
  if (files.length === 0) return null;

  function move(index: number, by: number) {
    const target = index + by;
    if (target < 0 || target >= files.length) return;
    const next = [...files];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function remove(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <ol className="mt-4 flex flex-col gap-2">
      {files.map((file, index) => (
        <li
          key={file.id}
          className="flex items-center gap-2 rounded-[12px] border border-line bg-background px-3 py-2"
        >
          {reorderable ? (
            <span
              aria-hidden="true"
              className="w-5 shrink-0 text-[13px] tabular-nums text-text-light"
            >
              {index + 1}
            </span>
          ) : null}

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold">{file.name}</span>
            <span className="block text-[12px] text-text-light">{formatBytes(file.size)}</span>
          </span>

          {reorderable && files.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="ek-btn ek-btn-quiet h-9 w-9 shrink-0 justify-center p-0 disabled:opacity-30"
                aria-label={`Move ${file.name} up`}
              >
                <ArrowUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === files.length - 1}
                className="ek-btn ek-btn-quiet h-9 w-9 shrink-0 justify-center p-0 disabled:opacity-30"
                aria-label={`Move ${file.name} down`}
              >
                <ArrowDown aria-hidden="true" className="h-4 w-4" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => remove(index)}
            className="ek-btn ek-btn-quiet h-9 w-9 shrink-0 justify-center p-0"
            aria-label={`Remove ${file.name}`}
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ol>
  );
}
