"use client";

import { useCallback, useRef, useState } from "react";
import { ImageUp } from "lucide-react";
import { ACCEPT_ATTRIBUTE } from "@/lib/imaging/imageSource";

type Props = {
  onFile: (file: File) => void;
  busy?: boolean;
  /** Shown in place of the guidance line when something went wrong. */
  error?: { message: string; hint: string } | null;
  /**
   * Called the first time someone shows they are about to upload — hovering,
   * focusing or dragging over the zone. Used to start fetching the face
   * detector, which takes long enough that a head start matters but is far too
   * heavy to pull down on page load.
   */
  onIntent?: () => void;
};

export function Dropzone({ onFile, busy = false, error = null, onIntent }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const take = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  return (
    <div>
      <div
        onPointerEnter={onIntent}
        onFocusCapture={onIntent}
        onDragEnter={onIntent}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer.files);
        }}
        className={`ek-card flex flex-col items-center justify-center px-6 py-10 text-center transition-colors ${
          dragging ? "border-primary bg-[#f1f7ff]" : "bg-bg-soft"
        }`}
      >
        <ImageUp
          aria-hidden="true"
          className="mb-4 text-text-light"
          size={28}
          strokeWidth={1.5}
        />
        <button
          type="button"
          className="ek-btn ek-btn-accent"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Reading your photo" : "Choose a photo"}
        </button>
        <p className="mt-3 text-[14px] text-text-light">
          <span className="hidden sm:inline">Or drop one here. </span>
          JPG, PNG or WebP.
        </p>

        <input
          ref={inputRef}
          type="file"
          // The visible control is the button above; this input stays in the
          // accessibility tree, so it needs its own name rather than relying on
          // the button's.
          aria-label="Choose a photo from your device"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(event) => {
            take(event.target.files);
            // Let the same file be picked twice in a row.
            event.target.value = "";
          }}
        />
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-[12px] border border-line bg-background p-4"
        >
          <p className="text-[14px] font-semibold text-foreground">{error.message}</p>
          <p className="mt-1 text-[14px] text-text-light">{error.hint}</p>
        </div>
      ) : (
        <p className="mt-4 text-[14px] text-text-light">
          Face the camera straight on, plain wall behind you, no glasses, even
          light. Your photo stays on this device.
        </p>
      )}
    </div>
  );
}
