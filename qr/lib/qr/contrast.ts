/**
 * Whether a colour pair will actually scan.
 *
 * A QR code is read by telling dark modules from light ones. Colour the two
 * too close and a camera cannot separate them; colour them the wrong way round,
 * light modules on a dark ground, and many scanners fail because they expect
 * dark on light. A tool that lets someone pick two pale colours and then hands
 * them a code that never scans has wasted their time silently, so this is
 * checked and said out loud.
 *
 * The contrast ratio is the WCAG one, which is well defined and matches how an
 * eye and a sensor separate two tones. Pure, so the thresholds are tested
 * rather than eyeballed.
 */

export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const v = hex.replace("#", "");
  const full = v.length === 3 ? v.split("").map((c) => c + c).join("") : v;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** Relative luminance, 0 for black and 1 for white, per WCAG. */
export function luminance([r, g, b]: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** The WCAG contrast ratio between two colours, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastVerdict =
  | { level: "ok"; ratio: number }
  | { level: "warn"; ratio: number; message: string }
  | { level: "bad"; ratio: number; message: string };

/**
 * The floor below which a code is unreliable, and the point below which it will
 * very likely fail. QR scanning tolerates less contrast than text does, so this
 * is stricter than the 4.5 text uses only at the bad end.
 */
const WARN_BELOW = 4.5;
const BAD_BELOW = 2;

/**
 * Judge a foreground and background pair.
 *
 * `dark` is the module colour, `light` the background. If the module colour is
 * the lighter of the two the code is inverted, which is called out on its own
 * because it scans badly regardless of how far apart the tones are.
 */
export function judgeContrast(dark: string, light: string): ContrastVerdict {
  const ratio = contrastRatio(dark, light);

  if (luminance(hexToRgb(dark)) > luminance(hexToRgb(light))) {
    return {
      level: "bad",
      ratio,
      message:
        "The code colour is lighter than the background, so the code is inverted. Many scanners will not read it. Swap the two colours.",
    };
  }

  if (ratio < BAD_BELOW) {
    return {
      level: "bad",
      ratio,
      message: "These colours are too close to tell apart. Most cameras will not read this code.",
    };
  }

  if (ratio < WARN_BELOW) {
    return {
      level: "warn",
      ratio,
      message:
        "The contrast is low, so this may not scan on every camera or in poor light. A darker code on a lighter background is safer.",
    };
  }

  return { level: "ok", ratio };
}
