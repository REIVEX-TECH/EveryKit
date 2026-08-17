"use client";

import { BACKGROUND_LABEL, type PhotoSpec } from "@/data/specs";
import type { RemovalProgress } from "@/lib/imaging/backgroundRemoval";

type Props = {
  spec: PhotoSpec;
  useReplacement: boolean;
  onChange: (useReplacement: boolean) => void;
  progress: RemovalProgress | null;
  error: string | null;
  /** True once a cutout exists, so switching back and forth is instant. */
  ready: boolean;
};

export function BackgroundToggle({
  spec,
  useReplacement,
  onChange,
  progress,
  error,
  ready,
}: Props) {
  const busy = progress !== null && progress.phase !== "done";
  const replacementLabel = BACKGROUND_LABEL[spec.background].toLowerCase();

  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Background"
        className="inline-flex rounded-full border border-line p-1"
      >
        <Option
          selected={!useReplacement}
          disabled={busy}
          onSelect={() => onChange(false)}
          label="Keep original background"
        />
        <Option
          selected={useReplacement}
          disabled={busy}
          onSelect={() => onChange(true)}
          label={`Make it ${replacementLabel}`}
        />
      </div>

      <div aria-live="polite" className="mt-3 min-h-[20px]">
        {busy ? (
          <div>
            <p className="text-[14px] text-text-light">
              {progress.message} This runs on your device, so it takes a moment.
            </p>
            <div className="mt-2 h-1 w-full max-w-[320px] overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${Math.round(progress.ratio * 100)}%` }}
              />
            </div>
          </div>
        ) : error ? (
          <p className="text-[14px] text-warn">{error}</p>
        ) : useReplacement && ready ? (
          <p className="text-[14px] text-text-light">
            Check the edges of your hair before you download. If they look rough,
            the original background may be the safer choice.
          </p>
        ) : (
          <p className="text-[14px] text-text-light">
            {spec.country} asks for a {replacementLabel} background. A plain wall
            usually passes without changing anything.
          </p>
        )}
      </div>
    </div>
  );
}

function Option({
  selected,
  disabled,
  onSelect,
  label,
}: {
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
        selected ? "bg-foreground text-white" : "text-text-light hover:text-foreground"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      {label}
    </button>
  );
}
