/**
 * What happens to the cutout after the background is gone.
 *
 * The removal produces a subject on transparent pixels. From there the user
 * picks: keep the transparency, or drop the subject onto a flat colour. The
 * colour maths and the naming live here, apart from the DOM, so they can be
 * tested without a canvas.
 */

export type OutputMode =
  | { kind: "transparent" }
  | { kind: "colour"; hex: string };

/** The presets on the row, in the order they appear. */
export const PRESETS: Array<{ label: string; hex: string }> = [
  { label: "White", hex: "#ffffff" },
  { label: "Off white", hex: "#f8fafc" },
  { label: "Light grey", hex: "#e2e8f0" },
  { label: "Passport blue", hex: "#dfe6ee" },
  { label: "Black", hex: "#171717" },
  { label: "Brand blue", hex: "#1d81f2" },
];

/**
 * Accept the shapes people actually type: with or without the hash, three
 * digits or six, any case. Anything else is refused rather than guessed at,
 * because a silently wrong colour is worse than being asked to fix the input.
 */
export function normaliseHex(input: string): string | null {
  const value = input.trim().replace(/^#/, "").toLowerCase();
  if (!/^[0-9a-f]{3}$/.test(value) && !/^[0-9a-f]{6}$/.test(value)) return null;
  const full =
    value.length === 3
      ? value.split("").map((character) => character + character).join("")
      : value;
  return `#${full}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalised = normaliseHex(hex);
  if (!normalised) return null;
  const value = normalised.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

/**
 * Composite a straight-alpha pixel over an opaque background.
 *
 * Straight rather than premultiplied, because that is what a canvas hands back
 * from getImageData. Getting this the wrong way round darkens every soft edge,
 * which on hair reads as a grey halo.
 */
export function compositeOver(
  pixel: { r: number; g: number; b: number; a: number },
  background: { r: number; g: number; b: number },
): { r: number; g: number; b: number } {
  const alpha = pixel.a / 255;
  return {
    r: Math.round(pixel.r * alpha + background.r * (1 - alpha)),
    g: Math.round(pixel.g * alpha + background.g * (1 - alpha)),
    b: Math.round(pixel.b * alpha + background.b * (1 - alpha)),
  };
}

/**
 * Whether the finished file needs an alpha channel.
 *
 * Only the transparent mode does. A flat colour behind the subject is opaque,
 * and saying so lets the export pick a format honestly rather than always
 * writing PNG and calling everything transparent.
 */
export function needsAlpha(mode: OutputMode): boolean {
  return mode.kind === "transparent";
}

/** The filename the download gets, which should say what the file is. */
export function outputFilename(originalName: string, mode: OutputMode): string {
  const dot = originalName.lastIndexOf(".");
  const stem = (dot > 0 ? originalName.slice(0, dot) : originalName) || "image";
  const suffix = mode.kind === "transparent" ? "no-background" : "background";
  return `${stem}-${suffix}.png`;
}

/** A short, plain description of the chosen output, for the UI and alt text. */
export function describeMode(mode: OutputMode): string {
  if (mode.kind === "transparent") return "Transparent background";
  const preset = PRESETS.find((option) => option.hex === mode.hex);
  return preset ? `${preset.label} background` : `Background ${mode.hex}`;
}
