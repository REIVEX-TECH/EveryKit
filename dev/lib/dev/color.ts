/**
 * Reading a colour in any of the three notations a developer types, and the
 * WCAG contrast between two of them.
 *
 * The conversions are where the bugs are: HSL's hue is degrees on a wheel and
 * wraps, its saturation and lightness are percentages, and the round trip
 * through RGB has to land back where it started or the swatch and the readout
 * disagree. All pure, so every corner is tested without a canvas.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Read hex (#abc or #aabbcc), rgb()/rgba(), or hsl()/hsla() into RGB.
 *
 * Tolerant of the things people actually paste: missing hash, extra spaces, an
 * alpha that is ignored because a contrast check is about the colours. Returns
 * null rather than guessing when it cannot make sense of the input.
 */
export function parseColor(input: string): Rgb | null {
  const text = input.trim().toLowerCase();
  if (text === "") return null;

  const hex = text.startsWith("#") ? text.slice(1) : text;
  if (/^[0-9a-f]{3}$/.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgb = text.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) {
    const r = clamp(Math.round(Number(rgb[1])), 0, 255);
    const g = clamp(Math.round(Number(rgb[2])), 0, 255);
    const b = clamp(Math.round(Number(rgb[3])), 0, 255);
    return { r, g, b };
  }

  const hsl = text.match(/^hsla?\(\s*([\d.]+)[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/);
  if (hsl) {
    return hslToRgb({
      h: Number(hsl[1]),
      s: clamp(Number(hsl[2]), 0, 100),
      l: clamp(Number(hsl[3]), 0, 100),
    });
  }

  return null;
}

// ---------------------------------------------------------------------------
// Conversions
// ---------------------------------------------------------------------------

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (n: number) => n.toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rf) h = ((gf - bf) / d) % 6;
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const sf = s / 100;
  const lf = l / 100;

  const c = (1 - Math.abs(2 * lf - 1)) * sf;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = lf - c / 2;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hue < 60) [rp, gp, bp] = [c, x, 0];
  else if (hue < 120) [rp, gp, bp] = [x, c, 0];
  else if (hue < 180) [rp, gp, bp] = [0, c, x];
  else if (hue < 240) [rp, gp, bp] = [0, x, c];
  else if (hue < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

export function formatRgb({ r, g, b }: Rgb): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl({ h, s, l }: Hsl): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// ---------------------------------------------------------------------------
// Contrast
// ---------------------------------------------------------------------------

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

export type WcagGrades = {
  ratio: number;
  /** 4.5:1 for normal text, 3:1 for large. */
  normalAA: boolean;
  normalAAA: boolean;
  largeAA: boolean;
  largeAAA: boolean;
};

/** The four WCAG pass/fail cells, from a contrast ratio. */
export function wcagGrades(ratio: number): WcagGrades {
  return {
    ratio,
    normalAA: ratio >= 4.5,
    normalAAA: ratio >= 7,
    largeAA: ratio >= 3,
    largeAAA: ratio >= 4.5,
  };
}
