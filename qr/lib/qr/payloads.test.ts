import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import {
  buildText,
  buildUrl,
  buildVCard,
  buildWhatsApp,
  buildWifi,
  type Result,
} from "./payloads";
import { toMatrix, toRgba } from "./render";

const value = <T,>(result: Result<T>): T => {
  if (!result.ok) throw new Error(`expected a value, got: ${result.error}`);
  return result.value;
};

const error = <T,>(result: Result<T>): string => {
  if (result.ok) throw new Error(`expected an error, got: ${String(result.value)}`);
  return result.error;
};

/**
 * Encode a payload and read it back with a real decoder.
 *
 * This is the test that matters. Asserting the payload string is correct only
 * proves the string is what was intended; running it through the encoder and
 * back out through a scanner proves the thing someone points a phone at
 * actually carries it. jsQR is the same decoder family as the ones in phone
 * cameras, so a round trip here is meaningful rather than circular.
 */
function scan(payload: string, level: "L" | "M" | "Q" | "H" = "M"): string | null {
  const matrix = toMatrix(payload, level);
  // Eight pixels per module, which is well past what any decoder needs and
  // keeps the test from failing over sampling rather than correctness.
  const { data, width, height } = toRgba(matrix, 8);
  return jsQR(data, width, height)?.data ?? null;
}

describe("buildUrl", () => {
  it("fills in the scheme people leave off", () => {
    expect(value(buildUrl("example.com"))).toBe("https://example.com/");
    expect(value(buildUrl("www.example.com/path"))).toBe("https://www.example.com/path");
  });

  it("leaves a scheme alone when there is one", () => {
    expect(value(buildUrl("http://example.com/"))).toBe("http://example.com/");
    expect(value(buildUrl("mailto:someone@example.com"))).toBe("mailto:someone@example.com");
  });

  it("keeps the query and fragment intact", () => {
    expect(value(buildUrl("example.com/a?b=c&d=e#f"))).toBe("https://example.com/a?b=c&d=e#f");
  });

  it("refuses what is not an address rather than encoding a dud", () => {
    expect(error(buildUrl(""))).toMatch(/Type or paste/);
    expect(error(buildUrl("localhost"))).toMatch(/missing a domain/);
    expect(error(buildUrl("http://"))).toMatch(/does not look like/);
  });
});

describe("buildText", () => {
  it("passes text through, trimmed at the ends only", () => {
    expect(value(buildText("  hello world  "))).toBe("hello world");
    expect(value(buildText("line one\nline two"))).toBe("line one\nline two");
  });

  it("asks for input rather than encoding nothing", () => {
    expect(error(buildText("   "))).toMatch(/Type the text/);
  });
});

describe("buildWifi", () => {
  it("writes the format a phone expects", () => {
    expect(
      value(buildWifi({ ssid: "Home", password: "secret", security: "WPA", hidden: false })),
    ).toBe("WIFI:T:WPA;S:Home;P:secret;;");
  });

  it("escapes the characters that would otherwise end a field", () => {
    // The bug this prevents: a scanner reads the password as "pa" and treats
    // the rest as a stray field, so the phone joins with the wrong key.
    const out = value(
      buildWifi({ ssid: "My;Net", password: "pa;ss:word", security: "WPA", hidden: false }),
    );
    expect(out).toBe("WIFI:T:WPA;S:My\\;Net;P:pa\\;ss\\:word;;");
  });

  it("escapes a backslash without double-escaping what follows", () => {
    const out = value(
      buildWifi({ ssid: "N", password: "a\\b;c", security: "WPA", hidden: false }),
    );
    expect(out).toBe("WIFI:T:WPA;S:N;P:a\\\\b\\;c;;");
  });

  it("leaves the password out of an open network", () => {
    const out = value(
      buildWifi({ ssid: "Cafe", password: "", security: "nopass", hidden: false }),
    );
    expect(out).toBe("WIFI:T:nopass;S:Cafe;;");
  });

  it("marks a hidden network", () => {
    const out = value(
      buildWifi({ ssid: "Quiet", password: "pw", security: "WPA", hidden: true }),
    );
    expect(out).toBe("WIFI:T:WPA;S:Quiet;P:pw;H:true;;");
  });

  it("will not build a secured network with no password", () => {
    expect(
      error(buildWifi({ ssid: "Home", password: "", security: "WPA", hidden: false })),
    ).toMatch(/Type the password/);
    expect(
      error(buildWifi({ ssid: "", password: "x", security: "WPA", hidden: false })),
    ).toMatch(/network name/);
  });
});

describe("buildVCard", () => {
  const base = {
    firstName: "Ada",
    lastName: "Lovelace",
    organisation: "",
    title: "",
    phone: "",
    email: "",
    url: "",
  };

  it("writes a card with the name in both forms", () => {
    const out = value(buildVCard(base));
    expect(out).toContain("N:Lovelace;Ada;;;");
    expect(out).toContain("FN:Ada Lovelace");
    expect(out.startsWith("BEGIN:VCARD\r\nVERSION:3.0")).toBe(true);
    expect(out.endsWith("END:VCARD")).toBe(true);
  });

  it("uses CRLF line endings", () => {
    expect(value(buildVCard(base)).split("\r\n").length).toBeGreaterThan(4);
  });

  it("escapes a name containing a comma", () => {
    // "Smith, Jr" would otherwise split into two components of the N field.
    const out = value(buildVCard({ ...base, lastName: "Smith, Jr" }));
    expect(out).toContain("N:Smith\\, Jr;Ada;;;");
  });

  it("leaves empty fields out entirely rather than writing blanks", () => {
    const out = value(buildVCard(base));
    expect(out).not.toContain("ORG:");
    expect(out).not.toContain("TEL");
    expect(out).not.toContain("EMAIL");
  });

  it("includes the optional fields when given", () => {
    const out = value(
      buildVCard({
        ...base,
        organisation: "Analytical Engines",
        title: "Mathematician",
        phone: "+44 20 7946 0000",
        email: "ada@example.com",
        url: "example.com",
      }),
    );
    expect(out).toContain("ORG:Analytical Engines");
    expect(out).toContain("TITLE:Mathematician");
    expect(out).toContain("TEL;TYPE=CELL:+44 20 7946 0000");
    expect(out).toContain("EMAIL;TYPE=INTERNET:ada@example.com");
    // Not escaped: escaping a URL's own syntax would break the link.
    expect(out).toContain("URL:https://example.com/");
  });

  it("needs at least one name", () => {
    expect(error(buildVCard({ ...base, firstName: "", lastName: "" }))).toMatch(/at least a/);
  });
});

describe("buildWhatsApp", () => {
  it("strips the formatting wa.me will not accept", () => {
    expect(value(buildWhatsApp({ phone: "+44 (20) 7946-0000", message: "" }))).toBe(
      "https://wa.me/442079460000",
    );
  });

  it("url-encodes the prefilled message", () => {
    expect(value(buildWhatsApp({ phone: "442079460000", message: "hello there & you" }))).toBe(
      "https://wa.me/442079460000?text=hello%20there%20%26%20you",
    );
  });

  it("catches the mistakes that produce a chat with nobody", () => {
    expect(error(buildWhatsApp({ phone: "020 7946 0000", message: "" }))).toMatch(/country code/);
    expect(error(buildWhatsApp({ phone: "12345", message: "" }))).toMatch(/full international/);
    expect(error(buildWhatsApp({ phone: "44abc", message: "" }))).toMatch(/only contain digits/);
    expect(error(buildWhatsApp({ phone: "", message: "" }))).toMatch(/Type the phone number/);
  });
});

describe("round trip through a real decoder", () => {
  it("reads back a link", () => {
    const payload = value(buildUrl("example.com/some/path?x=1"));
    expect(scan(payload)).toBe(payload);
  });

  it("reads back a Wi-Fi payload including its escapes", () => {
    const payload = value(
      buildWifi({ ssid: "My;Net", password: "pa;ss:word", security: "WPA", hidden: true }),
    );
    expect(scan(payload)).toBe(payload);
  });

  it("reads back a contact card with CRLF intact", () => {
    const payload = value(
      buildVCard({
        firstName: "Ada",
        lastName: "Smith, Jr",
        organisation: "Analytical Engines",
        title: "Mathematician",
        phone: "+44 20 7946 0000",
        email: "ada@example.com",
        url: "example.com",
      }),
    );
    const scanned = scan(payload);
    expect(scanned).toBe(payload);
    expect(scanned).toContain("\r\n");
  });

  it("reads back a WhatsApp link", () => {
    const payload = value(buildWhatsApp({ phone: "+44 20 7946 0000", message: "hi & bye" }));
    expect(scan(payload)).toBe(payload);
  });

  it("reads back text with characters outside ASCII", () => {
    const payload = value(buildText("café — naïve — 日本語"));
    expect(scan(payload)).toBe(payload);
  });

  it("reads back at every error correction level", () => {
    const payload = value(buildUrl("example.com"));
    for (const level of ["L", "M", "Q", "H"] as const) {
      expect(scan(payload, level)).toBe(payload);
    }
  });

  it("reads back a payload long enough to need a dense code", () => {
    const payload = value(buildText("x".repeat(600)));
    const matrix = toMatrix(payload);
    expect(matrix.version).toBeGreaterThan(10);
    expect(scan(payload)).toBe(payload);
  });
});
