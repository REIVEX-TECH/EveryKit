import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/**
 * The four-tile mark, as the browser-tab icon.
 *
 * The concept art had a glyph inside each tile. At 16 or 32 pixels those turn
 * to mud, so the tiles carry the mark on their own — which is exactly the size
 * this file exists to serve.
 */
export default function Icon() {
  const tile = (color: string) => ({
    width: 22,
    height: 22,
    borderRadius: 6,
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
          gap: 5,
          background: "#ffffff",
          padding: 5,
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
