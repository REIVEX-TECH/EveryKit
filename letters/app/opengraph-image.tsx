import { ImageResponse } from "next/og";

export const alt =
  "EveryKit Letters — a formal letter with the parts that came from form fields tinted";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TINT = "rgba(29, 129, 242, 0.3)";

/** The same idea as the hero: form fields tinted inside a finished letter. */
export default function OpengraphImage() {
  const filled = (text: string) => (
    <span style={{ backgroundColor: TINT, padding: "0 4px", borderRadius: 3 }}>{text}</span>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          background: "#ffffff",
          padding: "0 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", fontSize: 26, color: "#444444" }}>
            EveryKit Letters
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 54,
              fontWeight: 600,
              color: "#171717",
              lineHeight: 1.15,
              marginTop: 18,
            }}
          >
            Formal letters, written for you
          </div>
          <div style={{ display: "flex", fontSize: 25, color: "#444444", marginTop: 22 }}>
            Answer a few questions and the letter comes out right. Built in your
            browser.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 330,
            height: 466,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            padding: 34,
            fontSize: 12,
            lineHeight: 1.6,
            color: "#111111",
          }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            {filled("Sana Iqbal")}
          </div>
          <div style={{ display: "flex", marginTop: 18 }}>{filled("The Visa Section")}</div>
          <div style={{ display: "flex", marginTop: 14, color: "#111111" }}>
            18 August 2026
          </div>
          <div style={{ display: "flex", marginTop: 14, fontWeight: 600 }}>
            Invitation to visit
          </div>
          <div style={{ display: "flex", marginTop: 14 }}>Dear Sir or Madam,</div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 12 }}>
            I am {filled("Sana Iqbal")}, and I would like to invite{" "}
            {filled("my mother")} to visit me.
          </div>
          <div style={{ display: "flex", marginTop: 24 }}>Yours faithfully,</div>
        </div>
      </div>
    ),
    size,
  );
}
