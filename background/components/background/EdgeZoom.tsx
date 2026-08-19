"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The result, zoomed in on an edge, on a chequerboard.
 *
 * Every background remover looks flawless at thumbnail size. Hair and fine
 * edges are where they actually fail, and at 200px nobody can see it, so
 * someone downloads a cutout with a chewed outline and finds out later. This
 * picks the busiest edge in the cutout and shows it at 4x against a
 * chequerboard, which is the only way partial transparency is visible at all.
 *
 * The region is chosen rather than fixed: the most interesting edge is
 * wherever the alpha channel changes most, and on a portrait that is nearly
 * always the hairline.
 */
export function EdgeZoom({ cutout }: { cutout: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [found, setFound] = useState(true);
  const size = 220;
  const zoom = 4;

  useEffect(() => {
    const view = ref.current;
    if (!view) return;
    const ctx = view.getContext("2d");
    if (!ctx) return;

    const window_ = Math.round(size / zoom);
    const source = cutout.getContext("2d");
    if (!source) return;

    // Sample a coarse grid and score each cell by how much its alpha varies.
    // Reading the whole image at full resolution would be slow on a 12MP photo
    // and would not choose a better spot.
    const step = Math.max(1, Math.round(Math.min(cutout.width, cutout.height) / 60));
    let best = { x: 0, y: 0, score: -1 };

    try {
      const data = source.getImageData(0, 0, cutout.width, cutout.height).data;
      for (let y = window_; y < cutout.height - window_; y += step) {
        for (let x = window_; x < cutout.width - window_; x += step) {
          let edges = 0;
          for (let dy = -window_; dy <= window_; dy += step) {
            for (let dx = -window_; dx <= window_; dx += step) {
              const at = ((y + dy) * cutout.width + (x + dx)) * 4 + 3;
              const alpha = data[at];
              if (alpha > 8 && alpha < 247) edges += 2;
              else if (alpha === 0) edges += 0;
            }
          }
          if (edges > best.score) best = { x, y, score: edges };
        }
      }
    } catch {
      // A tainted canvas would throw here. Nothing in this kit taints one, but
      // failing to a centred crop beats failing to a blank panel.
      best = { x: Math.round(cutout.width / 2), y: Math.round(cutout.height / 3), score: 0 };
    }

    setFound(best.score > 0);

    view.width = size;
    view.height = size;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(
      cutout,
      Math.max(0, best.x - window_ / 2),
      Math.max(0, best.y - window_ / 2),
      window_,
      window_,
      0,
      0,
      size,
      size,
    );
  }, [cutout]);

  return (
    <div>
      <div
        className="inline-block rounded-[12px] border border-line p-1"
        // The chequerboard is what makes transparency visible. On a white card
        // a transparent cutout and a white one look identical.
        style={{
          backgroundImage:
            "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
        }}
      >
        <canvas
          ref={ref}
          width={size}
          height={size}
          className="block rounded-[8px]"
          aria-label="The edge of the cutout, magnified four times against a chequerboard"
        />
      </div>
      <p className="mt-2 max-w-[46ch] text-[13px] text-text-light">
        {found
          ? "The busiest edge, at four times size. Hair and fine strands are the hard part of this, so check them here before you download rather than after."
          : "No soft edge was found to magnify, which usually means the cutout is a hard shape. Check the full result above."}
      </p>
    </div>
  );
}
