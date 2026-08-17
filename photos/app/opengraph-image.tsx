import { ImageResponse } from "next/og";

export const alt =
  "EveryKit Photos — a loose selfie beside the same face cropped to 2 by 2 inches with measurement guides";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const GUIDE = "#1d81f2";
const SKIN = "#dcc0a6";
const HAIR = "#3f3f46";
const SHIRT = "#94a3b8";
const PHOTO_BG = "#eef2f6";

/**
 * The before-and-after pair on white. Same idea as the hero: a drawing, not a
 * photograph, so nothing here pretends to be a customer's result.
 *
 * Built from plain divs because Satori, which renders this, supports a subset
 * of CSS and no SVG paths worth relying on.
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
          padding: "0 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 64 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", fontSize: 26, color: "#444444", letterSpacing: 1 }}>
              EveryKit Photos
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 56,
                fontWeight: 600,
                color: "#171717",
                lineHeight: 1.15,
                marginTop: 18,
              }}
            >
              Passport photos, made in your browser
            </div>
            <div style={{ display: "flex", fontSize: 26, color: "#444444", marginTop: 22 }}>
              600 x 600 px, exactly 2 x 2 inches at 300 DPI. Your photo never
              leaves your device.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
            <Panel width={188} height={240} headTop={0.28} headHeight={0.34} guides={false} />
            <div style={{ display: "flex", fontSize: 34, color: "#cbd5e1" }}>→</div>
            <Panel width={240} height={240} headTop={0.13} headHeight={0.59} guides />
          </div>
        </div>
      </div>
    ),
    size,
  );
}

function Panel({
  width,
  height,
  headTop,
  headHeight,
  guides,
}: {
  width: number;
  height: number;
  headTop: number;
  headHeight: number;
  guides: boolean;
}) {
  const crown = headTop * height;
  const headPx = headHeight * height;
  const chin = crown + headPx;
  const headWidth = headPx * 0.74;

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width,
        height,
        background: PHOTO_BG,
        border: `1px solid ${guides ? GUIDE : "#94a3b8"}`,
        overflow: "hidden",
      }}
    >
      {/* Shoulders */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - headWidth * 1.05,
          top: chin + headPx * 0.22,
          width: headWidth * 2.1,
          height: height,
          background: SHIRT,
          borderRadius: `${headWidth}px ${headWidth}px 0 0`,
        }}
      />
      {/* Neck */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - headWidth * 0.17,
          top: chin - headPx * 0.1,
          width: headWidth * 0.34,
          height: headPx * 0.4,
          background: SKIN,
        }}
      />
      {/* Hair */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - (headWidth * 1.1) / 2,
          top: crown,
          width: headWidth * 1.1,
          height: headPx,
          background: HAIR,
          borderRadius: "50%",
        }}
      />
      {/* Face */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - headWidth / 2,
          top: crown + headPx * 0.09,
          width: headWidth,
          height: headPx * 0.92,
          background: SKIN,
          borderRadius: "50%",
        }}
      />

      {guides ? (
        <>
          <Rule top={crown} width={width} />
          <Rule top={chin} width={width} />
          <div
            style={{
              position: "absolute",
              left: 12,
              top: crown,
              width: 1,
              height: chin - crown,
              background: GUIDE,
            }}
          />
          <div
            style={{
              position: "absolute",
              display: "flex",
              left: 20,
              top: (crown + chin) / 2 - 10,
              fontSize: 15,
              color: GUIDE,
            }}
          >
            25–35 mm
          </div>
        </>
      ) : null}
    </div>
  );
}

function Rule({ top, width }: { top: number; width: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top,
        width,
        height: 1,
        background: GUIDE,
      }}
    />
  );
}
