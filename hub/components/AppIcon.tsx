import type { ReactElement } from "react";

/**
 * The launcher icons: one white glyph on one flat tinted square per kit.
 *
 * Why these are drawn here rather than reused from `/icons/*.svg`: those files
 * are complete little pictures in blue, orange and white, built to sit on a
 * white card. An icon in a launcher is the other shape entirely, a single
 * white mark on a coloured tile, and there is no filter that turns one into the
 * other without losing the white cut-outs that make them legible. The subject
 * of each glyph is unchanged, so the two sets still read as the same kit.
 *
 * The registry keeps owning what a kit is. This file only decides how its
 * square looks, and a kit it has never heard of still gets a tile.
 */

/** The one tile that is not blue, so the grid carries the mark's proportion. */
const ACCENT = "#ff8a4c";

/**
 * Shades of the brand blue, every one of them at least 3:1 against white so
 * the glyph stays legible as a graphic. They run darker than `--primary`
 * rather than lighter: lighter blues lose that contrast within a step or two.
 */
const BLUES = ["#1d81f2", "#1769d4", "#2f6fd0", "#3d8ae8", "#145cb8"] as const;

/**
 * Which square each kit gets.
 *
 * Pinned by slug so that adding a kit never reshuffles the ones already there:
 * a launcher whose icons change colour between visits is a launcher nobody can
 * learn. Photos takes the accent because it is the flagship and the first tile,
 * so the one orange square lands where the eye starts, the way it does in the
 * mark.
 */
const TINTS: Record<string, string> = {
  photos: ACCENT,
  letters: BLUES[0],
  pdf: BLUES[1],
  qr: BLUES[2],
  images: BLUES[3],
  background: BLUES[4],
  text: BLUES[0],
  sign: BLUES[1],
  invoice: BLUES[2],
  ringtone: BLUES[4],
  dev: BLUES[1],
  study: BLUES[3],
  calc: BLUES[2],
};

/**
 * A kit that is not in the table still gets a stable colour, chosen from its
 * own slug rather than from its position, so it does not move when the one
 * before it is renamed.
 */
export function tintFor(slug: string): string {
  const pinned = TINTS[slug];
  if (pinned) return pinned;

  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) % 1000;
  return BLUES[hash % BLUES.length];
}

/** Shared drawing settings: white, rounded ends, one weight throughout. */
const stroke = {
  fill: "none",
  stroke: "#ffffff",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const solid = { fill: "#ffffff" } as const;

/**
 * One glyph per kit, on a 24 unit grid.
 *
 * Each keeps the subject of the kit's existing icon: a head and shoulders for
 * Photos, a written sheet for Letters, two sheets for PDF, and so on. The
 * shapes that would collide at this size were pulled apart deliberately.
 * Letters is an outlined sheet with lines in it, Text is the lines with no
 * sheet at all, and Invoice is the sheet with a torn edge and a total rule, so
 * three kits that are all "a document" do not arrive as the same square.
 */
const GLYPHS: Record<string, ReactElement> = {
  photos: (
    <>
      <circle cx="12" cy="9" r="3.6" {...solid} />
      <path d="M5.4 19.6c0-3.6 2.9-6.3 6.6-6.3s6.6 2.7 6.6 6.3z" {...solid} />
    </>
  ),
  letters: (
    <>
      <path d="M6 3.2h7.6L18 7.6v13.2H6z" {...stroke} />
      <path d="M13.6 3.2v4.4H18" {...stroke} />
      <path d="M8.6 12h6.8M8.6 15.2h6.8M8.6 18.4h4" {...stroke} />
    </>
  ),
  pdf: (
    <>
      <path d="M4.6 3.4h6.2v2.2H6.8v11.2H4.6z" {...solid} />
      <path d="M9 6.4h6.4l4 4v10.2H9z" {...stroke} />
      <path d="M15.4 6.4v4h4" {...stroke} />
      <path d="M11.6 14.2h5.2M11.6 17.4h3.2" {...stroke} />
    </>
  ),
  qr: (
    <>
      <rect x="3.6" y="3.6" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="13.4" y="3.6" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="3.6" y="13.4" width="7" height="7" rx="1.6" {...stroke} />
      <rect x="6.1" y="6.1" width="2" height="2" rx="0.5" {...solid} />
      <rect x="15.9" y="6.1" width="2" height="2" rx="0.5" {...solid} />
      <rect x="6.1" y="15.9" width="2" height="2" rx="0.5" {...solid} />
      <rect x="13.4" y="13.4" width="2.6" height="2.6" rx="0.7" {...solid} />
      <rect x="17.8" y="17.8" width="2.6" height="2.6" rx="0.7" {...solid} />
      <rect x="13.4" y="17.8" width="2.6" height="2.6" rx="0.7" {...solid} />
    </>
  ),
  images: (
    <>
      <rect x="3.4" y="5.4" width="17.2" height="13.2" rx="2.2" {...stroke} />
      <circle cx="8.6" cy="10" r="1.7" {...solid} />
      <path d="M4.6 16.8l4.6-4.4 3.2 3 2.8-2.6 4.2 4" {...stroke} />
    </>
  ),
  background: (
    <>
      <rect
        x="3.4"
        y="3.4"
        width="17.2"
        height="17.2"
        rx="2.4"
        {...stroke}
        strokeDasharray="2.6 2.4"
      />
      <circle cx="12" cy="10.2" r="2.9" {...solid} />
      <path d="M6.8 19.4c0-2.9 2.3-5.2 5.2-5.2s5.2 2.3 5.2 5.2z" {...solid} />
    </>
  ),
  text: (
    <>
      <path d="M4.4 6.6h15.2M4.4 11h15.2M4.4 15.4h10.4M4.4 19.8h6.6" {...stroke} />
    </>
  ),
  sign: (
    <>
      <path d="M4 15.4c2.6-5.8 4.6-9 6-9 1.4 0 .6 6.6 2.6 6.6 1.6 0 2.6-4 5.4-6.2" {...stroke} />
      <path d="M4 19.8h16" {...stroke} />
    </>
  ),
  invoice: (
    <>
      <path d="M5.4 3.4h13.2v17.2l-2.2-1.5-2.2 1.5-2.2-1.5-2.2 1.5-2.2-1.5-2.2 1.5z" {...stroke} />
      <path d="M8.6 8.2h6.8M8.6 11.6h6.8" {...stroke} />
      <path d="M8.6 15.2h6.8" {...stroke} strokeWidth={2.4} />
    </>
  ),
  ringtone: (
    <>
      <path
        d="M4.4 10.4v3.2M8 6.6v10.8M11.6 3.6v16.8M15.2 8.2v7.6M18.8 11v2"
        {...stroke}
        strokeWidth={2}
      />
    </>
  ),
  dev: (
    <>
      <path d="M8.6 8.4L4.8 12l3.8 3.6M15.4 8.4l3.8 3.6-3.8 3.6" {...stroke} />
      <path d="M13.4 5.6l-2.8 12.8" {...stroke} />
    </>
  ),
  study: (
    <>
      <path d="M12 4.2L3.4 8.4 12 12.6l8.6-4.2z" {...stroke} />
      <path d="M6.6 10.4v4.8c0 1.8 2.4 3.2 5.4 3.2s5.4-1.4 5.4-3.2v-4.8" {...stroke} />
      <path d="M20.6 8.4v5" {...stroke} />
    </>
  ),
  calc: (
    <>
      <rect x="5.4" y="3.4" width="13.2" height="17.2" rx="2.4" {...stroke} />
      <path d="M8.4 7.4h7.2" {...stroke} />
      <rect x="8.2" y="11.2" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="13.4" y="11.2" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="8.2" y="15.8" width="2.4" height="2.4" rx="0.6" {...solid} />
      <rect x="13.4" y="15.8" width="2.4" height="2.4" rx="0.6" {...solid} />
    </>
  ),
};

/**
 * The glyph for a kit, or its initial when there is no glyph for that slug.
 *
 * The fallback is the point: a kit added to the registry tomorrow renders a
 * proper tile today, rather than an empty square or a colour icon fighting its
 * own background.
 */
export function AppGlyph({ slug, name }: { slug: string; name: string }) {
  const glyph = GLYPHS[slug];

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[55%] w-[55%]">
      {glyph ?? (
        <text
          x="12"
          y="12"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontWeight="600"
          fill="#ffffff"
        >
          {name.replace(/^EveryKit\s+/, "").charAt(0).toUpperCase()}
        </text>
      )}
    </svg>
  );
}
