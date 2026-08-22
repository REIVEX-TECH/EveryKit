"use client";

import { useRef } from "react";
import { ImageUp } from "lucide-react";
import { formatBytes } from "@/lib/images/resize";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * The single-image dropzone the crop, compress, flip and favicon tools share.
 *
 * The batch Workbench has its own multi-file version; these four each take one
 * image, so they use this instead of carrying a files list they never grow.
 */
export function ImagePicker({
  onPick,
  current,
  label = "Drop an image here, or",
}: {
  onPick: (file: File) => void;
  current: File | null;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(list: FileList | null) {
    const file = list?.[0];
    if (file && file.type.startsWith("image/")) onPick(file);
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handle(event.dataTransfer.files);
      }}
      className="ek-card flex flex-col items-center gap-3 border-dashed p-6 text-center"
    >
      <ImageUp aria-hidden="true" className="h-7 w-7 text-text-light" />
      <p className="text-[15px]">{current ? current.name : label}</p>
      {current ? (
        <p className="text-[13px] text-text-light">{formatBytes(current.size)}</p>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="ek-btn ek-btn-accent"
      >
        {current ? "Choose a different image" : "Choose an image"}
      </button>
      <input
        ref={inputRef}
        type="file"
        aria-label="Choose an image from your device"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          handle(event.target.files);
          event.target.value = "";
        }}
      />
      <p className="text-[13px] text-text-light">JPG, PNG and WebP. It stays on your device.</p>
    </div>
  );
}
