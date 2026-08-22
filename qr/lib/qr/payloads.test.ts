import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import {
  buildEmail,
  buildEvent,
  buildSms,
  buildText,
  buildUrl,
  buildVCard,
  buildWhatsApp,
  buildWifi,
  type Result,
} from "./payloads";
import { logoPlacement, toMatrix, toRgba } from "./render";

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

/** Decode raw pixels, for the logo-overlay test that edits them first. */
function scanRaw(
  data: Uint8ClampedArray<ArrayBuffer>,
  width: number,
  height: number,
): string | null {
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


describe("buildEmail", () => {
  it("builds a bare mailto for an address alone", () => {
    expect(value(buildEmail({ to: "ada@example.com", subject: "", body: "" }))).toBe(
      "mailto:ada@example.com",
    );
  });

  it("percent-encodes the subject and body so an & cannot split them", () => {
    const payload = value(
      buildEmail({ to: "ada@example.com", subject: "Tea & cake", body: "3pm?" }),
    );
    expect(payload).toBe("mailto:ada@example.com?subject=Tea%20%26%20cake&body=3pm%3F");
  });

  it("rejects a missing or malformed address", () => {
    expect(error(buildEmail({ to: "", subject: "", body: "" }))).toMatch(/address/i);
    expect(error(buildEmail({ to: "not-an-email", subject: "", body: "" }))).toMatch(/email/i);
  });
});

describe("buildSms", () => {
  it("uses SMSTO with the number alone when there is no message", () => {
    expect(value(buildSms({ phone: "+44 20 7946 0000", message: "" }))).toBe(
      "SMSTO:+442079460000",
    );
  });

  it("keeps the message after a second colon, verbatim", () => {
    const payload = value(buildSms({ phone: "07700900000", message: "Running late: 10 min" }));
    expect(payload).toBe("SMSTO:07700900000:Running late: 10 min");
  });

  it("rejects a number with letters in it", () => {
    expect(error(buildSms({ phone: "CALL-ME", message: "" }))).toMatch(/digits/i);
  });
});

describe("buildEvent", () => {
  it("wraps a timed event in a VCALENDAR with floating local times", () => {
    const payload = value(
      buildEvent({
        title: "Launch",
        location: "",
        description: "",
        startDate: "2027-03-01",
        startTime: "15:00",
        endDate: "",
        endTime: "16:30",
      }),
    );
    expect(payload).toContain("BEGIN:VCALENDAR");
    expect(payload).toContain("BEGIN:VEVENT");
    expect(payload).toContain("DTSTART:20270301T150000");
    expect(payload).toContain("DTEND:20270301T163000");
    expect(payload).toContain("SUMMARY:Launch");
    expect(payload).toContain("END:VCALENDAR");
    expect(payload).toContain("\r\n");
  });

  it("uses DATE values and an exclusive next-day end for an all-day event", () => {
    const payload = value(
      buildEvent({
        title: "Holiday",
        location: "",
        description: "",
        startDate: "2027-12-25",
        startTime: "",
        endDate: "2027-12-25",
        endTime: "",
      }),
    );
    expect(payload).toContain("DTSTART;VALUE=DATE:20271225");
    expect(payload).toContain("DTEND;VALUE=DATE:20271226");
  });

  it("escapes commas and semicolons in the text fields", () => {
    const payload = value(
      buildEvent({
        title: "Drinks, then dinner; bring cash",
        location: "The Bell; Main St",
        description: "",
        startDate: "2027-03-01",
        startTime: "18:00",
        endDate: "",
        endTime: "20:00",
      }),
    );
    expect(payload).toContain("SUMMARY:Drinks\\, then dinner\\; bring cash");
    expect(payload).toContain("LOCATION:The Bell\\; Main St");
  });

  it("is deterministic, so the same event gives the same code", () => {
    const input = {
      title: "Launch",
      location: "",
      description: "",
      startDate: "2027-03-01",
      startTime: "15:00",
      endDate: "",
      endTime: "16:30",
    };
    expect(value(buildEvent(input))).toBe(value(buildEvent(input)));
  });

  it("rejects an event that ends before it starts", () => {
    expect(
      error(
        buildEvent({
          title: "Backwards",
          location: "",
          description: "",
          startDate: "2027-03-01",
          startTime: "16:00",
          endDate: "2027-03-01",
          endTime: "15:00",
        }),
      ),
    ).toMatch(/ends before/i);
  });

  it("needs a title and a start", () => {
    expect(
      error(buildEvent({ title: "", location: "", description: "", startDate: "2027-03-01", startTime: "15:00", endDate: "", endTime: "16:00" })),
    ).toMatch(/name/i);
    expect(
      error(buildEvent({ title: "X", location: "", description: "", startDate: "", startTime: "15:00", endDate: "", endTime: "16:00" })),
    ).toMatch(/day and time/i);
  });
});

describe("the new kinds round-trip through a real decoder", () => {
  it("reads back a mailto", () => {
    const payload = value(buildEmail({ to: "ada@example.com", subject: "Tea & cake", body: "hi" }));
    expect(scan(payload)).toBe(payload);
  });
  it("reads back an SMSTO", () => {
    const payload = value(buildSms({ phone: "+44 20 7946 0000", message: "on my way" }));
    expect(scan(payload)).toBe(payload);
  });
  it("reads back a calendar event", () => {
    const payload = value(
      buildEvent({
        title: "Launch party",
        location: "The Bell, Main St",
        description: "Bring a friend",
        startDate: "2027-03-01",
        startTime: "18:00",
        endDate: "",
        endTime: "20:00",
      }),
    );
    expect(scan(payload, "H")).toBe(payload);
  });
});

describe("a code with a centre logo still decodes", () => {
  it("reads back at level H with the middle blanked to a logo-sized hole", () => {
    // The hole is drawn white, the worst case: it reads as light modules
    // rather than obvious damage. If H can still decode through it, a real
    // opaque logo of the same size is safe.
    const payload = value(buildUrl("https://useeverykit.com/qr/some/link"));
    const matrix = toMatrix(payload, "H");
    const scale = 8;
    const { data, width, height } = toRgba(matrix, scale);

    const box = logoPlacement(matrix, 0.2);
    const x0 = Math.round(box.x * scale);
    const y0 = Math.round(box.y * scale);
    const x1 = Math.round((box.x + box.size) * scale);
    const y1 = Math.round((box.y + box.size) * scale);
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const at = (y * width + x) * 4;
        data[at] = 255;
        data[at + 1] = 255;
        data[at + 2] = 255;
        data[at + 3] = 255;
      }
    }

    expect(scanRaw(data, width, height)).toBe(payload);
  });
});
