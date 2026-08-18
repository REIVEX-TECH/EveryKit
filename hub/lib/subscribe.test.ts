import { describe, expect, it } from "vitest";
import {
  MAX_EMAIL_LENGTH,
  isAllowedOrigin,
  isHoneypotFilled,
  normaliseEmail,
  normaliseKit,
} from "./subscribe";

describe("normaliseEmail", () => {
  it("trims and lowercases, so one person cannot become two rows", () => {
    expect(normaliseEmail("  Ahad@Example.COM ")).toBe("ahad@example.com");
  });

  it("accepts the shapes real addresses take", () => {
    for (const email of [
      "a@b.co",
      "first.last@example.com",
      "name+tag@example.co.uk",
      "user_name@sub.domain.org",
      "123@numbers.io",
      "ahad@reivex.io",
    ]) {
      expect([email, normaliseEmail(email)]).toEqual([email, email]);
    }
  });

  it("rejects what is obviously not an address", () => {
    for (const bad of [
      "", "   ", "no-at-sign", "@example.com", "name@", "name@nodot",
      "two@@example.com", "spaces in@example.com", "name@example..com",
      ".leading@example.com", "trailing.@example.com", "do..uble@example.com",
      "name@example.com, other@example.com",
      "<script>@example.com",
    ]) {
      expect([bad, normaliseEmail(bad)]).toEqual([bad, null]);
    }
  });

  it("rejects non-strings and over-long input", () => {
    expect(normaliseEmail(undefined)).toBeNull();
    expect(normaliseEmail(42)).toBeNull();
    expect(normaliseEmail({})).toBeNull();
    expect(normaliseEmail(`${"a".repeat(MAX_EMAIL_LENGTH)}@example.com`)).toBeNull();
  });
});

describe("normaliseKit", () => {
  it("keeps the known kits", () => {
    expect(normaliseKit("photos")).toBe("photos");
    expect(normaliseKit("letters")).toBe("letters");
  });

  it("falls back to hub rather than storing whatever was sent", () => {
    expect(normaliseKit("'; drop table emails; --")).toBe("hub");
    expect(normaliseKit(undefined)).toBe("hub");
    expect(normaliseKit(7)).toBe("hub");
  });
});

describe("isAllowedOrigin", () => {
  it("allows the hub and its kit subdomains over https", () => {
    expect(isAllowedOrigin("https://useeverykit.com")).toBe(true);
    expect(isAllowedOrigin("https://photos.useeverykit.com")).toBe(true);
    expect(isAllowedOrigin("https://letters.useeverykit.com")).toBe(true);
    // A kit that does not exist yet still works, which is the point.
    expect(isAllowedOrigin("https://invoices.useeverykit.com")).toBe(true);
  });

  it("refuses lookalikes and anything that is not ours", () => {
    for (const origin of [
      "https://useeverykit.com.attacker.dev",
      "https://notuseeverykit.com",
      "https://evil.com",
      "http://useeverykit.com",
      "https://a.b.useeverykit.com",
      "useeverykit.com",
      "null",
      "",
    ]) {
      expect([origin, isAllowedOrigin(origin)]).toEqual([origin, false]);
    }
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it("allows localhost only away from production", () => {
    expect(isAllowedOrigin("http://localhost:3000", false)).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000", true)).toBe(false);
  });
});

describe("isHoneypotFilled", () => {
  it("is false for the empty field a real form submits", () => {
    expect(isHoneypotFilled({})).toBe(false);
    expect(isHoneypotFilled({ honeypot: "" })).toBe(false);
    expect(isHoneypotFilled({ honeypot: "   " })).toBe(false);
  });

  it("is true once something fills it", () => {
    expect(isHoneypotFilled({ honeypot: "http://spam" })).toBe(true);
  });
});
