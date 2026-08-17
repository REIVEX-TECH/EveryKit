import { ImageResponse } from "next/og";
import { kits } from "@/data/kits";

export const alt = "EveryKit — small tools for everyday problems";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** The wordmark and the kit grid on white. Nothing invented. */
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
        <div style={{ display: "flex", fontSize: 60, fontWeight: 600, color: "#171717" }}>
          Every<span style={{ color: "#1d81f2" }}>Kit</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#444444", marginTop: 16 }}>
          Small tools for everyday problems. Pay once, done in a minute.
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 48 }}>
          {kits.map((kit) => (
            <div
              key={kit.slug}
              style={{
                display: "flex",
                flexDirection: "column",
                width: 440,
                padding: 24,
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                background: kit.status === "live" ? "#ffffff" : "#f8fafc",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", fontSize: 26, color: "#171717" }}>{kit.name}</div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    color: "#444444",
                  }}
                >
                  {kit.status === "live" ? "live" : "coming soon"}
                </div>
              </div>
              <div style={{ display: "flex", fontSize: 21, color: "#444444", marginTop: 8 }}>
                {kit.tagline}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
