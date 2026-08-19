import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The home-screen icon. iOS rounds the corners and supplies the background. */
export default function AppleIcon() {
  const tile = (color: string) => ({
    width: 66,
    height: 66,
    borderRadius: 17,
    background: color,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap: 14,
          background: "#ffffff",
          padding: 14,
        }}
      >
        <div style={tile("#1d81f2")} />
        <div style={tile("#ff8a4c")} />
        <div style={tile("#1d81f2")} />
        <div style={tile("#1d81f2")} />
      </div>
    ),
    size,
  );
}
