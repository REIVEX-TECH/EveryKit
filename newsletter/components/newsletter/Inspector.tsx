"use client";

import { AlignCenter, AlignLeft, AlignRight, ImageOff } from "lucide-react";
import type { Align, Block, NewsletterImage } from "@/lib/newsletter/blocks";
import { blockLabel } from "@/lib/newsletter/blocks";

/**
 * The right-hand inspector: every control for the selected block, and nothing
 * when nothing is selected. It writes patches back through onChange, so the
 * block model stays the single source of truth.
 */
export function Inspector({
  block,
  images,
  onChange,
  onPickImage,
  onClearImage,
}: {
  block: Block | null;
  images: NewsletterImage[];
  onChange: (patch: Partial<Block>) => void;
  onPickImage: () => void;
  onClearImage: () => void;
}) {
  if (!block) {
    return (
      <div className="text-[13px] text-text-light">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide">Inspector</h2>
        <p className="mt-2">Select a block on the canvas to edit it here.</p>
      </div>
    );
  }

  const has = (key: string) => key in block;

  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">
        {blockLabel(block.type)}
      </h2>

      <div className="mt-3 flex flex-col gap-4">
        {block.type === "heading" || block.type === "text" || block.type === "banner" || block.type === "footer" ? (
          <Area label="Text" value={block.text} onChange={(text) => onChange({ text } as Partial<Block>)} />
        ) : null}

        {block.type === "twoColumn" ? (
          <>
            <Area label="Left column" value={block.left} onChange={(left) => onChange({ left } as Partial<Block>)} />
            <Area label="Right column" value={block.right} onChange={(right) => onChange({ right } as Partial<Block>)} />
          </>
        ) : null}

        {block.type === "image" ? (
          <ImageControls block={block} images={images} onPickImage={onPickImage} onClearImage={onClearImage} onChange={onChange} />
        ) : null}

        {block.type === "button" ? (
          <>
            <Text label="Label" value={block.label} onChange={(label) => onChange({ label } as Partial<Block>)} />
            <Text label="Link" value={block.href} placeholder="https://" onChange={(href) => onChange({ href } as Partial<Block>)} />
            <Swatch label="Button colour" value={block.buttonColor} onChange={(buttonColor) => onChange({ buttonColor } as Partial<Block>)} />
            <Swatch label="Button text" value={block.buttonTextColor} onChange={(buttonTextColor) => onChange({ buttonTextColor } as Partial<Block>)} />
            <NumberRow label="Corner radius" value={block.radius} min={0} max={40} onChange={(radius) => onChange({ radius } as Partial<Block>)} />
          </>
        ) : null}

        {block.type === "divider" ? (
          <>
            <NumberRow label="Thickness" value={block.thickness} min={1} max={20} onChange={(thickness) => onChange({ thickness } as Partial<Block>)} />
            <Swatch label="Line colour" value={block.lineColor} onChange={(lineColor) => onChange({ lineColor } as Partial<Block>)} />
          </>
        ) : null}

        {block.type === "spacer" ? (
          <NumberRow label="Height" value={block.height} min={4} max={200} onChange={(height) => onChange({ height } as Partial<Block>)} />
        ) : null}

        {/* Shared style controls, shown only where they apply. */}
        {"align" in block ? (
          <AlignRow value={block.align} onChange={(align) => onChange({ align } as Partial<Block>)} />
        ) : null}

        {"color" in block ? (
          <Swatch label="Text colour" value={(block as { color: string }).color} onChange={(color) => onChange({ color } as Partial<Block>)} />
        ) : null}

        <Swatch label="Background" value={block.background} onChange={(background) => onChange({ background } as Partial<Block>)} />

        {"fontSize" in block ? (
          <NumberRow label="Font size" value={(block as { fontSize: number }).fontSize} min={9} max={60} onChange={(fontSize) => onChange({ fontSize } as Partial<Block>)} />
        ) : null}

        {has("padding") && block.type !== "spacer" ? (
          <NumberRow label="Padding" value={block.padding} min={0} max={120} onChange={(padding) => onChange({ padding } as Partial<Block>)} />
        ) : null}
      </div>
    </div>
  );
}

function ImageControls({
  block,
  images,
  onPickImage,
  onClearImage,
  onChange,
}: {
  block: Extract<Block, { type: "image" }>;
  images: NewsletterImage[];
  onPickImage: () => void;
  onClearImage: () => void;
  onChange: (patch: Partial<Block>) => void;
}) {
  const chosen = images.find((image) => image.id === block.imageId) ?? null;
  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className="block text-[13px] font-semibold">Picture</span>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" onClick={onPickImage} className="ek-btn ek-btn-quiet py-2 text-[13px]">
            {chosen ? "Replace" : "Choose image"}
          </button>
          {chosen ? (
            <button type="button" onClick={onClearImage} className="inline-flex items-center gap-1 text-[13px] text-text-light hover:text-danger">
              <ImageOff aria-hidden="true" className="h-4 w-4" />
              Clear
            </button>
          ) : null}
        </div>
        {chosen ? <p className="mt-1 truncate text-[12px] text-text-light">{chosen.name}</p> : null}
      </div>
      <NumberRow label="Width (px)" value={block.width} min={20} max={600} onChange={(width) => onChange({ width } as Partial<Block>)} />
      <Text label="Alt text" value={block.alt} placeholder="Describe the image" onChange={(alt) => onChange({ alt } as Partial<Block>)} />
      <Text label="Link" value={block.href} placeholder="https://" onChange={(href) => onChange({ href } as Partial<Block>)} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const FIELD = "w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[14px] outline-none focus:border-primary";

function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <Row label={label}>
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={FIELD} />
    </Row>
  );
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD} min-h-[80px] leading-relaxed`} />
    </Row>
  );
}

function NumberRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 accent-primary"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 rounded-[8px] border border-line bg-background px-2 py-1 text-[13px] tabular-nums outline-none focus:border-primary"
        />
      </div>
    </Row>
  );
}

function Swatch({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-9 w-10 shrink-0 cursor-pointer rounded-[8px] border border-line bg-background p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[8px] border border-line bg-background px-2 py-1.5 font-mono text-[13px] outline-none focus:border-primary"
        />
      </div>
    </Row>
  );
}

function AlignRow({ value, onChange }: { value: Align; onChange: (v: Align) => void }) {
  const options: Array<{ value: Align; icon: typeof AlignLeft; label: string }> = [
    { value: "left", icon: AlignLeft, label: "Left" },
    { value: "center", icon: AlignCenter, label: "Centre" },
    { value: "right", icon: AlignRight, label: "Right" },
  ];
  return (
    <Row label="Alignment">
      <div className="flex gap-1">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              aria-label={option.label}
              onClick={() => onChange(option.value)}
              className={`inline-flex h-9 flex-1 items-center justify-center rounded-[8px] border ${
                active ? "border-primary bg-primary/5 text-primary-dark" : "border-line text-text-light hover:border-line-strong"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </Row>
  );
}
