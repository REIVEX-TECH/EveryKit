import { ImageResponse } from "next/og";
import { KIT_NAME } from "@/lib/site";

export const alt =
  "EveryKit Dev, ten developer tools drawn as a grid of squares, with a line saying nothing leaves the browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#1d81f2";
const PRIMARY_DARK = "#1769d4";
const ACCENT = "#ff8a4c";
const LINE = "#cbd5e1";
const SOFT = "#f8fafc";
const TEXT = "#171717";
const MUTED = "#444444";

/** The ten tools, in the order the launcher shows them. */
const TILES = [
  { label: "JSON", tint: ACCENT },
  { label: "Base64", tint: PRIMARY },
  { label: "URL", tint: PRIMARY_DARK },
  { label: "UUID", tint: "#2f6fd0" },
  { label: "Hash", tint: "#3d8ae8" },
  { label: "JWT", tint: "#145cb8" },
  { label: "Regex", tint: PRIMARY },
  { label: "Diff", tint: PRIMARY_DARK },
  { label: "Time", tint: "#2f6fd0" },
  { label: "Cron", tint: "#145cb8" },
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
          Ten small developer tools
        </div>

        <div
          style={{
            display: "flex",
            gap: 18,
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
              style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 92 }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 17,
                  background: tile.tint,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 19,
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
          All of it in your browser. Nothing you paste is uploaded.
        </div>
      </div>
    ),
    size,
  );
}
