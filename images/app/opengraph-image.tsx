import { ImageResponse } from "next/og";

export const alt =
  "EveryKit PDF — two documents becoming one, with the whole operation drawn inside the outline of a single device";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#1d81f2";
const ACCENT = "#ff8a4c";
const LINE = "#cbd5e1";
const SOFT = "#f8fafc";
const TEXT = "#171717";
const MUTED = "#444444";

/**
 * The same idea as the page: the boundary of the device is the picture.
 *
 * Built from plain divs because Satori, which renders this, supports a subset
 * of CSS and no SVG paths worth relying on. Nothing here is a screenshot or a
 * claimed result — it is a diagram, and it says what it is.
 */
export default function OpengraphImage() {
  const rule = (width: number) => ({
    width,
    height: 8,
    borderRadius: 4,
    background: PRIMARY,
  });

  const sheet = (accent: boolean) => ({
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
    width: 132,
    height: 176,
    padding: 20,
    borderRadius: 10,
    background: "#ffffff",
    border: `3px solid ${accent ? ACCENT : LINE}`,
  });

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
          <span style={{ color: MUTED }}>PDF</span>
        </div>

        <div style={{ display: "flex", fontSize: 62, fontWeight: 600, color: TEXT, marginTop: 24 }}>
          PDF tools that never upload your file
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            marginTop: 44,
            padding: "28px 36px",
            borderRadius: 20,
            background: SOFT,
            border: `3px solid ${LINE}`,
          }}
        >
          <div style={sheet(false)}>
            <div style={rule(84)} />
            <div style={rule(84)} />
            <div style={rule(52)} />
          </div>

          <div style={sheet(false)}>
            <div style={rule(84)} />
            <div style={rule(66)} />
          </div>

          <div style={{ display: "flex", fontSize: 46, color: ACCENT, fontWeight: 600 }}>→</div>

          <div style={sheet(true)}>
            <div style={rule(84)} />
            <div style={rule(84)} />
            <div style={rule(84)} />
            <div style={rule(52)} />
          </div>

          <div style={{ display: "flex", fontSize: 26, color: MUTED, marginLeft: 12 }}>
            all of it inside this device
          </div>
        </div>
      </div>
    ),
    size,
  );
}
