import { ImageResponse } from "next/og";

/**
 * The 192px maskable mark for the web app manifest, the size Android Chrome
 * looks for before it offers "Add to home screen". Same mark and safe-zone as
 * the 512px version, generated statically at build time.
 */
export const dynamic = "force-static";

const SIZE = 192;

export function GET() {
  const tileSize = Math.round(SIZE * 0.28);
  const gap = Math.round(SIZE * 0.05);
  const radius = Math.round(tileSize * 0.28);
  const tile = (background: string) => ({ width: tileSize, height: tileSize, borderRadius: radius, background });

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: "flex",
          flexWrap: "wrap",
          alignContent: "center",
          justifyContent: "center",
          gap,
          background: "#ffffff",
        }}
      >
        <div style={tile("#1d81f2")} />
        <div style={tile("#ff8a4c")} />
        <div style={tile("#1d81f2")} />
        <div style={tile("#1d81f2")} />
      </div>
    ),
    { width: SIZE, height: SIZE },
  );
}
