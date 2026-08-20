import { ImageResponse } from "next/og";
import { KIT_NAME } from "@/lib/site";

export const alt =
  "EveryKit Calc, five calculator squares in a row, with a line saying the answer is worked out in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#1d81f2";
const PRIMARY_DARK = "#1769d4";
const ACCENT = "#ff8a4c";
const LINE = "#cbd5e1";
const SOFT = "#f8fafc";
const TEXT = "#171717";
const MUTED = "#444444";

/** The five calculators, in the order the launcher shows them. */
const TILES = [
  { label: "Age", tint: ACCENT },
  { label: "Dates", tint: PRIMARY },
  { label: "Units", tint: PRIMARY_DARK },
  { label: "Loan", tint: "#2f6fd0" },
  { label: "Percent", tint: "#145cb8" },
];

/**
 * The picture is the kit: ten squares, named.
 *
 * Built from plain divs because Satori, which renders this, supports a subset
 * of CSS and no SVG paths worth relying on. Nothing here is a screenshot or a
 * claimed result.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#ffffff",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: TEXT }}>
          <span style={{ fontWeight: 600 }}>Every</span>
          <span style={{ fontWeight: 600, color: PRIMARY }}>Kit</span>
          <span style={{ color: LINE, margin: "0 14px" }}>|</span>
          <span style={{ color: MUTED }}>{KIT_NAME}</span>
        </div>

        <div style={{ display: "flex", fontSize: 58, fontWeight: 600, color: TEXT, marginTop: 22 }}>
          Everyday calculators
        </div>

        <div
          style={{
            display: "flex",
            gap: 26,
            marginTop: 40,
            padding: "28px 30px",
            borderRadius: 20,
            background: SOFT,
            border: `3px solid ${LINE}`,
          }}
        >
          {TILES.map((tile) => (
            <div
              key={tile.label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 132 }}
            >
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 24,
                  background: tile.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {tile.label.slice(0, 4)}
              </div>
              <div style={{ display: "flex", fontSize: 17, color: MUTED, marginTop: 10 }}>
                {tile.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 34 }}>
          Worked out in your browser. Nothing you type is uploaded.
        </div>
      </div>
    ),
    size,
  );
}
