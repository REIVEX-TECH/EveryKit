import { ImageResponse } from "next/og";
import { KIT_NAME } from "@/lib/site";

export const alt =
  "EveryKit Ringtone, a waveform with a short span of it marked off as the part that becomes the ringtone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PRIMARY = "#1d81f2";
const PRIMARY_DARK = "#1769d4";
const ACCENT = "#ff8a4c";
const LINE = "#cbd5e1";
const SOFT = "#f8fafc";
const TEXT = "#171717";
const MUTED = "#444444";

/**
 * The picture is the selection: a waveform, and the slice of it you keep.
 *
 * Built from plain divs because Satori, which renders this, supports a subset
 * of CSS and no SVG paths worth relying on. The bar heights come from a fixed
 * list rather than anything random, so the image is byte-identical on every
 * build and is not a claimed result from a real song.
 */
const BARS = [
  14, 22, 38, 30, 52, 44, 68, 58, 40, 30, 46, 62, 78, 90, 72, 84, 96, 80, 66, 88,
  74, 92, 60, 76, 54, 68, 44, 58, 36, 48, 30, 40, 24, 34, 20, 28, 44, 36, 22, 16,
];

/** Where the marked span sits, as bar indexes. */
const FROM = 12;
const TO = 25;

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

        <div style={{ display: "flex", fontSize: 62, fontWeight: 600, color: TEXT, marginTop: 24 }}>
          Keep the part of the song you want
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: 220,
            gap: 6,
            marginTop: 44,
            padding: "24px 32px",
            borderRadius: 20,
            background: SOFT,
            border: `3px solid ${LINE}`,
          }}
        >
          {BARS.map((height, index) => {
            const inside = index >= FROM && index <= TO;
            return (
              <div
                key={index}
                style={{
                  width: 18,
                  height: height * 1.5,
                  borderRadius: 4,
                  background: inside ? PRIMARY_DARK : LINE,
                }}
              />
            );
          })}

          <div style={{ display: "flex", flexDirection: "column", marginLeft: 28 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: ACCENT }}>
              30 seconds
            </div>
            <div style={{ display: "flex", fontSize: 24, color: MUTED, marginTop: 6 }}>
              saved as an MP3
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
