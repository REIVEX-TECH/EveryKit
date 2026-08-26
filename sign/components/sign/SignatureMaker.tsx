"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import { inkHex, type InkId } from "@/lib/sign/strokes";
import { renderTyped, typedToSvg, type SignatureFont } from "@/lib/sign/typed";
import { SignaturePad, type PadHandle } from "./SignaturePad";

export const SIGNATURE_FONTS: SignatureFont[] = [
  { id: "caveat", label: "Caveat", cssVariable: "--font-caveat" },
  { id: "dancing", label: "Dancing Script", cssVariable: "--font-dancing" },
  { id: "great-vibes", label: "Great Vibes", cssVariable: "--font-great-vibes" },
  { id: "homemade", label: "Homemade Apple", cssVariable: "--font-homemade" },
];

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Draw or type a signature, then take it as PNG or SVG.
 *
 * Both modes are here rather than in two components because the export panel,
 * the ink choice and the gate are identical; only the surface differs.
 */
export function SignatureMaker({
  mode,
  onSignature,
}: {
  mode: "draw" | "type";
  /** Called whenever a usable signature exists, for the PDF tool to pick up. */
  onSignature?: (png: Blob | null) => void;
}) {
  const [ink, setInk] = useState<InkId>("black");
  const [hasInk, setHasInk] = useState(false);
  const [pad, setPad] = useState<PadHandle | null>(null);
  const [name, setName] = useState("");
  const [font, setFont] = useState<SignatureFont>(SIGNATURE_FONTS[0]);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const [svgNote, setSvgNote] = useState<string | null>(null);

  const ready = mode === "draw" ? hasInk : name.trim() !== "";

  const makePng = useCallback(async (): Promise<Blob | null> => {
    if (mode === "draw") return pad ? pad.toPngBlob() : null;
    const rendered = renderTyped(name, font, inkHex(ink));
    if (!rendered) return null;
    return new Promise((resolve) => rendered.canvas.toBlob(resolve, "image/png"));
  }, [mode, pad, name, font, ink]);

  // Hand the signature up so the PDF tool can use it without a second draw.
  useEffect(() => {
    if (!onSignature) return;
    let cancelled = false;
    if (!ready) {
      onSignature(null);
      return;
    }
    void makePng().then((blob) => {
      if (!cancelled) onSignature(blob);
    });
    return () => {
      cancelled = true;
    };
  }, [ready, makePng, onSignature]);

  function take(action: () => void) {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }

  async function savePng() {
    const blob = await makePng();
    if (blob) download(blob, "signature.png");
  }

  async function saveSvg() {
    if (mode === "draw") {
      const svg = pad?.toSvg() ?? "";
      if (svg) download(new Blob([svg], { type: "image/svg+xml" }), "signature.svg");
      return;
    }
    const result = await typedToSvg(name, font, inkHex(ink));
    if (!result) return;
    setSvgNote(
      result.fontEmbedded
        ? null
        : "The handwriting font could not be embedded in this SVG, so it will fall back to a plain face on a computer that does not have it. The PNG is the safer choice here.",
    );
    download(new Blob([result.svg], { type: "image/svg+xml" }), "signature.svg");
  }

  return (
    <div className="flex flex-col gap-5">
      {mode === "draw" ? (
        <SignaturePad ink={ink} onInkChange={setInk} onChange={setHasInk} onReady={setPad} />
      ) : (
        <TypedPad
          name={name}
          onName={setName}
          font={font}
          onFont={setFont}
          ink={ink}
          onInk={setInk}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => take(() => void savePng())}
          disabled={!ready}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          PNG
        </button>
        <button
          type="button"
          onClick={() => take(() => void saveSvg())}
          disabled={!ready}
          className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download aria-hidden="true" className="h-4 w-4" />
          SVG
        </button>
      </div>

      <p className="max-w-[60ch] text-[13px] text-text-light">
        The PNG has a genuinely transparent background and is drawn at three times size, so it
        stays sharp in print. The SVG scales to any size at all.
      </p>

      {svgNote ? (
        <p role="alert" className="max-w-[60ch] text-[13px] text-warn">
          {svgNote}
        </p>
      ) : null}

      {gateFor ? (
        <EmailGate
          actionLabel="Download"
          onDone={() => {
            gateFor();
            setGateFor(null);
          }}
          onCancel={() => setGateFor(null)}
        />
      ) : null}
    </div>
  );
}

function TypedPad({
  name,
  onName,
  font,
  onFont,
  ink,
  onInk,
}: {
  name: string;
  onName: (value: string) => void;
  font: SignatureFont;
  onFont: (font: SignatureFont) => void;
  ink: InkId;
  onInk: (ink: InkId) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="name" className="block text-[14px] font-semibold">
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="Ada Lovelace"
          className="mt-2 w-full max-w-[420px] rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none placeholder:text-text-light focus:border-primary"
        />
      </div>

      <fieldset>
        <legend className="text-[14px] font-semibold">Handwriting</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {SIGNATURE_FONTS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onFont(option)}
              aria-pressed={font.id === option.id}
              className={[
                "flex min-h-[56px] items-center overflow-hidden rounded-[12px] border px-4 py-2 text-left transition-colors",
                font.id === option.id
                  ? "border-primary-dark bg-primary/5"
                  : "border-line hover:border-line-strong",
              ].join(" ")}
              style={{ fontFamily: `var(${option.cssVariable})`, fontSize: 24 }}
            >
              <span className="min-w-0 truncate">
                {name.trim() === "" ? option.label : name}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-[14px] font-semibold">Ink</legend>
        <div className="mt-2 flex gap-2">
          {(["black", "blue"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onInk(id)}
              aria-pressed={ink === id}
              aria-label={`${id === "black" ? "Black" : "Blue"} ink`}
              className={[
                "inline-flex min-h-[36px] items-center gap-2 rounded-full border px-3 py-2 text-[14px] transition-colors",
                ink === id
                  ? "border-primary-dark text-foreground"
                  : "border-line text-text-light hover:border-line-strong",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full border border-line"
                style={{ background: inkHex(id) }}
              />
              {id === "black" ? "Black" : "Blue"}
            </button>
          ))}
        </div>
      </fieldset>

      {name.trim() === "" ? (
        <div className="ek-card flex min-h-[120px] items-center justify-center p-4">
          <p className="text-[14px] text-text-light">Your signature appears here as you type.</p>
        </div>
      ) : (
        <FitSignature text={name} fontVariable={font.cssVariable} color={inkHex(ink)} />
      )}
    </div>
  );
}

/**
 * The on-screen signature preview, scaled so it always sits inside its box.
 *
 * The name is laid out once at a comfortable base size and then shrunk with a
 * transform to fit the box's width, with its padding respected, however long the
 * name is. Only the preview is scaled: the exported PNG and SVG are drawn
 * separately at their own true proportions. The box clips, so even the single
 * frame before the measurement runs can never spill onto the page, and it
 * re-measures on resize and once the handwriting font has loaded, since the text
 * width depends on the face.
 */
function FitSignature({
  text,
  fontVariable,
  color,
}: {
  text: string;
  fontVariable: string;
  color: string;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    const measure = () => {
      const style = window.getComputedStyle(box);
      const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const available = box.clientWidth - padX;
      // scrollWidth is the unscaled layout width: the transform never changes it,
      // so this is the natural width at the base size whatever the current scale.
      const natural = el.scrollWidth;
      if (natural > 0 && available > 0) setScale(Math.min(1, available / natural));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);

    let active = true;
    if (typeof document !== "undefined" && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (active) measure();
      });
    }

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [text, fontVariable]);

  return (
    <div
      ref={boxRef}
      className="ek-card flex min-h-[120px] items-center justify-center overflow-hidden p-4"
    >
      <span
        ref={textRef}
        style={{
          fontFamily: `var(${fontVariable})`,
          fontSize: 56,
          color,
          lineHeight: 1.4,
          whiteSpace: "nowrap",
          display: "inline-block",
          transform: `scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {text}
      </span>
    </div>
  );
}
