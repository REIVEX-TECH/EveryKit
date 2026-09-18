import { ImageResponse } from "next/og";

/**
 * A large, maskable version of the four-tile mark for the web app manifest, so
 * EveryKit can be added to a phone home screen and show a proper icon rather
 * than a screenshot. Force-static, so it is generated at build time and costs
 * nothing to serve.
 *
 * Maskable means the important part sits inside the middle 80 percent; the mark
 * is held to the centre ~62 percent on a white field so a circular Android mask
 * never clips a tile.
 */
export const dynamic = "force-static";

const SIZE = 512;

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
