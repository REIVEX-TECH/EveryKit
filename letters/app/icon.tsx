import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The EveryKit mark: an "EK" monogram taking the wordmark's two-tone split,
 * dark "E" and primary "K". Flat, no gradient, legible once the browser has
 * shrunk it into a tab.
 *
 * A monogram rather than sentence case: this is a mark, not copy.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          fontSize: 34,
          fontWeight: 600,
          fontFamily: "sans-serif",
          letterSpacing: -1,
        }}
      >
        <span style={{ color: "#171717" }}>E</span>
        <span style={{ color: "#1d81f2" }}>K</span>
      </div>
    ),
    size,
  );
}
