import { ImageResponse } from "next/og";
import { KIT_NAME } from "@/lib/site";

export const alt =
  "EveryKit Newsletter, an email being assembled from stacked blocks, with a line saying it is built in your browser and never uploaded";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#1d81f2";
const ACCENT = "#ff8a4c";
const LINE = "#cbd5e1";
const SOFT = "#f8fafc";
const TEXT = "#171717";
const MUTED = "#444444";

/**
 * The picture is the tool: a small email taking shape from blocks.
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
          Drag and drop email builder
        </div>

        <div
          style={{
            display: "flex",
            gap: 30,
            marginTop: 40,
            padding: 30,
            borderRadius: 20,
            background: SOFT,
            border: `3px solid ${LINE}`,
          }}
        >
          {/* A little email mock, stacked blocks on a 600px-feel column. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              width: 360,
              padding: 20,
              borderRadius: 14,
              background: "#ffffff",
              border: `2px solid ${LINE}`,
            }}
          >
            <div style={{ display: "flex", width: 220, height: 26, borderRadius: 6, background: TEXT }} />
            <div style={{ display: "flex", width: "100%", height: 12, borderRadius: 4, background: LINE }} />
            <div style={{ display: "flex", width: "88%", height: 12, borderRadius: 4, background: LINE }} />
            <div style={{ display: "flex", width: "100%", height: 96, borderRadius: 8, background: "#dfe6ee" }} />
            <div
              style={{
                display: "flex",
                width: 150,
                height: 40,
                borderRadius: 999,
                background: ACCENT,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
            {["Heading", "Text", "Image", "Button", "Footer"].map((label) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", width: 16, height: 16, borderRadius: 5, background: PRIMARY }} />
                <div style={{ display: "flex", fontSize: 24, color: MUTED }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: MUTED, marginTop: 34 }}>
          Built in your browser. Nothing is uploaded.
        </div>
      </div>
    ),
    size,
  );
}
