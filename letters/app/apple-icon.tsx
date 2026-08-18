import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * The home-screen icon. iOS rounds the corners itself and puts it on a real
 * background, so this fills the square rather than floating a small mark.
 */
export default function AppleIcon() {
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
          fontSize: 92,
          fontWeight: 600,
          fontFamily: "sans-serif",
          letterSpacing: -3,
        }}
      >
        <span style={{ color: "#171717" }}>E</span>
        <span style={{ color: "#1d81f2" }}>K</span>
      </div>
    ),
    size,
  );
}
