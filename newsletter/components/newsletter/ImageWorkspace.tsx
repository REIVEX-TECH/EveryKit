"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import type { NewsletterImage } from "@/lib/newsletter/blocks";

export const IMAGE_DRAG_TYPE = "application/x-ek-image";

/**
 * The image workspace. Images are read into memory as data URLs and never
 * uploaded; they are dragged onto the canvas or picked in the image block's
 * inspector, and only the ones actually placed are written on export.
 */
export function ImageWorkspace({
  images,
  onAdd,
  onRemove,
}: {
  images: NewsletterImage[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">Images</h2>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setOver(false);
          if (event.dataTransfer.files.length > 0) onAdd(event.dataTransfer.files);
        }}
        className={`mt-2 rounded-[12px] border border-dashed p-3 text-center ${
          over ? "border-primary bg-bg-soft" : "border-line-strong"
        }`}
      >
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="ek-btn ek-btn-quiet w-full justify-center py-2 text-[13px]"
        >
          <ImagePlus aria-hidden="true" className="h-4 w-4" />
          Add images
        </button>
        <p className="mt-2 text-[12px] text-text-light">or drop files here. They stay on your device.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-label="Add images from your device"
          onChange={(event) => {
            if (event.target.files) onAdd(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      {images.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {images.map((image) => (
            <li key={image.id} className="group relative">
              <div
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(IMAGE_DRAG_TYPE, image.id);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                className="aspect-square cursor-grab overflow-hidden rounded-[8px] border border-line bg-bg-soft active:cursor-grabbing"
                title={`${image.name} (drag onto the canvas)`}
              >
                {/* Data URL preview; next/image is for served files, not blobs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.dataUrl} alt={image.name} className="h-full w-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => onRemove(image.id)}
                aria-label={`Remove ${image.name}`}
                className="absolute -right-1.5 -top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-line bg-background text-text-light shadow-sm hover:text-danger"
              >
                <X aria-hidden="true" className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-text-light">No images yet.</p>
      )}
    </div>
  );
}
