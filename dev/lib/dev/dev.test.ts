import { describe, expect, it } from "vitest";
import { excerpt, formatJson, humanBytes, lineAndColumn, minifyJson, summarise, validateJson } from "./json";
import {
  decodeBase64,
  decodeBase64ToBytes,
  decodeUrl,
  encodeBase64,
  encodeUrl,
  bytesToBase64,
} from "./encode";
import { V4_PATTERN, clampCount, generateUuids, uuidFromBytes } from "./uuid";
import { hashFile, hashText, matchesDigest, toHex } from "./hash";
import { claimDate, decodeJwt, expiryState } from "./jwt";
import { compile, highlight, runRegex } from "./regex";
import { describeSummary, lineDiff, wordDiff } from "./diff";
import {
  guessUnit,
  localZoneName,
  parseLocalDateTime,
  parseStamp,
  relative,
  toIsoUtc,
  toLocalString,
  toUnixSeconds,
} from "./timestamp";

// Fixtures that are not English, because that is where every one of these
// tools has historically been wrong.
const EMOJI = "👍🏽 family 👨‍👩‍👧‍👦 done";
const URDU = "یہ ایک جملہ ہے۔ اور یہ دوسرا ہے؟";
const MIXED = `${URDU} ${EMOJI} ¡señor! 中文`;

describe("JSON", () => {
  it("formats with two spaces and round trips", () => {
    const result = formatJson('{"b":1,"a":[1,2]}');
    expect(result.ok && result.output).toBe('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');
  });

  it("minifies away every byte that is not structure", () => {
    const result = minifyJson('{\n  "a" : 1,\n  "b" : [ 1, 2 ]\n}');
    expect(result.ok && result.output).toBe('{"a":1,"b":[1,2]}');
  });

  it("keeps text that is not English intact through a round trip", () => {
    const source = JSON.stringify({ text: MIXED });
    const formatted = formatJson(source);
    expect(formatted.ok).toBe(true);
    if (!formatted.ok) return;
    expect(JSON.parse(formatted.output).text).toBe(MIXED);
  });

  it("reports the line and column of a syntax error, not a character offset", () => {
    const broken = '{\n  "a": 1,\n  "b" 2\n}';
    const result = formatJson(broken);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.line).toBe(3);
    expect(result.error.column).toBeGreaterThan(6);
    expect(result.error.excerpt).toContain("^");
  });

  it("puts the caret under the column it reported", () => {
    const caret = excerpt("hello world", 1, 7);
    expect(caret.split("\n")[1]).toBe("      ^");
  });

  it("counts lines and columns the way an editor does, from one", () => {
    const text = "ab\ncd\nef";
    expect(lineAndColumn(text, 0)).toEqual({ line: 1, column: 1 });
    expect(lineAndColumn(text, 3)).toEqual({ line: 2, column: 1 });
    expect(lineAndColumn(text, 7)).toEqual({ line: 3, column: 2 });
  });

  it("says nothing is wrong with an empty box, rather than calling it invalid", () => {
    const result = validateJson("   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain("nothing to check");
  });

  it("describes what a valid document is", () => {
    expect(summarise([1, 2, 3])).toBe("an array of 3 items");
    expect(summarise([1])).toBe("an array of 1 item");
    expect(summarise({ a: 1, b: 2 })).toBe("an object with 2 keys");
    expect(summarise(null)).toBe("null");
    expect(summarise(42)).toBe("a single number value");
  });

  it("handles a 5MB document without complaint", () => {
    const big = JSON.stringify({ rows: Array.from({ length: 55_000 }, (_, i) => ({ i, s: "x".repeat(80) })) });
    expect(big.length).toBeGreaterThan(5_000_000);
    const started = Date.now();
    const result = minifyJson(big);
    expect(result.ok).toBe(true);
    // Not a benchmark, a canary: if this ever takes seconds the worker in the
    // UI is doing something other than what this does.
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it("writes sizes the way a person reads them", () => {
    expect(humanBytes(512)).toBe("512 bytes");
    expect(humanBytes(2048)).toBe("2.0 kB");
    expect(humanBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("base64", () => {
  it("round trips ASCII", () => {
    expect(encodeBase64("hello")).toBe("aGVsbG8=");
    const back = decodeBase64("aGVsbG8=");
    expect(back.ok && back.text).toBe("hello");
  });

  it("round trips emoji, including the ones made of several code points", () => {
    const encoded = encodeBase64(EMOJI);
    const back = decodeBase64(encoded);
    expect(back.ok && back.text).toBe(EMOJI);
  });

  it("round trips Urdu", () => {
    const encoded = encodeBase64(URDU);
    const back = decodeBase64(encoded);
    expect(back.ok && back.text).toBe(URDU);
  });

  it("produces the same bytes a UTF-8 encoder would", () => {
    // The naive btoa workaround found in most answers online gets this wrong.
    expect(encodeBase64("é")).toBe("w6k=");
    expect(encodeBase64("中")).toBe("5Lit");
  });

  it("accepts base64 that arrives wrapped, padded oddly, or URL-safe", () => {
    expect(decodeBase64("aGVs\nbG8=").ok).toBe(true);
    expect(decodeBase64("aGVsbG8").ok).toBe(true);
    const urlSafe = encodeBase64("~subject?a=1&b=2").replace(/\+/g, "-").replace(/\//g, "_");
    const back = decodeBase64(urlSafe);
    expect(back.ok && back.text).toBe("~subject?a=1&b=2");
  });

  it("refuses what is not base64, and says why", () => {
    const result = decodeBase64("not base64 !!!");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("not base64");
  });

  it("says so when the bytes decode but are not text", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0xfd, 0x00]);
    const result = decodeBase64(bytesToBase64(bytes));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("not text");
  });

  it("hands back raw bytes for the file side", () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255]);
    const result = decodeBase64ToBytes(bytesToBase64(bytes));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect([...result.bytes]).toEqual([0, 1, 2, 253, 254, 255]);
  });

  it("encodes a large buffer without hitting the argument limit", () => {
    // String.fromCharCode(...bytes) throws a RangeError past about 100k.
    const big = new Uint8Array(600_000).fill(65);
    expect(bytesToBase64(big).length).toBeGreaterThan(700_000);
  });
});

describe("URL encoding", () => {
  it("escapes a component including the structural characters", () => {
    expect(encodeUrl("a b&c=d/e?f", "component")).toBe("a%20b%26c%3Dd%2Fe%3Ff");
  });

  it("leaves a full URL's structure alone", () => {
    expect(encodeUrl("https://x.com/a b?q=1&r=2", "full")).toBe("https://x.com/a%20b?q=1&r=2");
  });

  it("round trips text that is not English in both modes", () => {
    for (const mode of ["component", "full"] as const) {
      const back = decodeUrl(encodeUrl(URDU, mode), mode);
      expect(back.ok && back.text).toBe(URDU);
    }
  });

  it("explains a broken percent escape rather than throwing", () => {
    const result = decodeUrl("100%", "component");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("%25");
  });
});

describe("UUIDs", () => {
  it("lays out version 4 and the RFC variant, whatever the random bytes were", () => {
    const zeros = uuidFromBytes(new Uint8Array(16));
    expect(zeros).toBe("00000000-0000-4000-8000-000000000000");
    const ones = uuidFromBytes(new Uint8Array(16).fill(0xff));
    expect(ones).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
    expect(V4_PATTERN.test(zeros)).toBe(true);
    expect(V4_PATTERN.test(ones)).toBe(true);
  });

  it("generates the number asked for, all well formed and all different", () => {
    const list = generateUuids(100);
    expect(list).toHaveLength(100);
    expect(list.every((id) => V4_PATTERN.test(id))).toBe(true);
    expect(new Set(list).size).toBe(100);
  });

  it("pulls a silly count into range instead of refusing", () => {
    expect(clampCount(0)).toBe(1);
    expect(clampCount(-5)).toBe(1);
    expect(clampCount(1000)).toBe(100);
    expect(clampCount(3.7)).toBe(3);
    expect(clampCount(Number.NaN)).toBe(1);
  });
});

describe("hashes", () => {
  it("matches the published vectors for the empty string", async () => {
    const digests = await hashText("");
    expect(digests.sha256).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(digests.sha1).toBe("da39a3ee5e6b4b0d3255bfef95601890afd80709");
    expect(digests.md5).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it("matches the published vectors for abc", async () => {
    const digests = await hashText("abc");
    expect(digests.sha256).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(digests.sha1).toBe("a9993e364706816aba3e25717850c26c9cd0d89d");
    expect(digests.md5).toBe("900150983cd24fb0d6963f7d28e17f72");
  });

  it("hashes the UTF-8 bytes, so text that is not English is right too", async () => {
    // The bytes of "é" are C3 A9; hashing the UTF-16 unit would give another answer.
    const digests = await hashText("é");
    expect(digests.md5).toBe("66ddcd97cfdeabb2f6fb8a999b4bc76f");
  });

  it("streams a file to the same answer it would give for the string", async () => {
    // Over one chunk, so the streaming path is genuinely exercised and the
    // progress callback fires more than once.
    const text = "abc".repeat(2_000_000);
    const fromText = await hashText(text);
    const seen: number[] = [];
    const fromFile = await hashFile(new Blob([text]), (ratio) => seen.push(ratio));
    expect(fromFile).toEqual(fromText);
    expect(seen.length).toBeGreaterThan(1);
    expect(seen[seen.length - 1]).toBe(1);
  });

  it("hashes an empty file without dividing by zero", async () => {
    const digests = await hashFile(new Blob([]));
    expect(digests.md5).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it("recognises a checksum somebody pastes in, whatever its case", async () => {
    const digests = await hashText("abc");
    expect(matchesDigest(digests, " 900150983CD24FB0D6963F7D28E17F72 ")).toBe("md5");
    expect(matchesDigest(digests, digests.sha256)).toBe("sha256");
    expect(matchesDigest(digests, "deadbeef")).toBeNull();
    expect(matchesDigest(digests, "")).toBeNull();
  });

  it("writes bytes as lower case hex", () => {
    expect(toHex(new Uint8Array([0, 15, 16, 255]).buffer)).toBe("000f10ff");
  });
});

describe("JWT", () => {
  // A real-shaped token, signed with nothing anybody uses. The signature is
  // never checked, which is the point of the tool.
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
    ".eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyNDI2MjJ9" +
    ".SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

  it("takes a token apart into header, payload and signature", () => {
    const result = decodeJwt(token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.token.header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(result.token.payload.sub).toBe("1234567890");
    expect(result.token.signature).toBe("SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c");
    expect(result.token.payloadText).toContain('"name": "John Doe"');
  });

  it("takes a token with a Bearer prefix, since that is how they are copied", () => {
    expect(decodeJwt(`Bearer ${token}`).ok).toBe(true);
  });

  it("counts the parts when there are not three", () => {
    const result = decodeJwt("a.b");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("This has 2");
  });

  it("refuses a token whose parts are not JSON", () => {
    const result = decodeJwt("bm90anNvbg.bm90anNvbg.sig");
    expect(result.ok).toBe(false);
  });

  it("reads exp and nbf as seconds, per the spec", () => {
    expect(claimDate({ exp: 1516242622 }, "exp")?.toISOString()).toBe("2018-01-18T02:30:22.000Z");
    expect(claimDate({ exp: "soon" }, "exp")).toBeNull();
    expect(claimDate({}, "exp")).toBeNull();
  });

  it("reports expiry without pretending to enforce it", () => {
    const now = Date.parse("2020-01-01T00:00:00Z");
    expect(expiryState({ exp: 1516242622 }, now)).toMatchObject({ state: "expired" });
    expect(expiryState({ exp: 4102444800 }, now)).toMatchObject({ state: "valid" });
    expect(expiryState({}, now)).toEqual({ state: "none" });
    expect(expiryState({ nbf: 4102444800, exp: 4102444900 }, now)).toMatchObject({ state: "not-yet" });
  });
});

describe("regex", () => {
  it("finds every match with the global flag", () => {
    const result = runRegex("a(b)", "g", "ab ab ab");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches).toHaveLength(3);
    expect(result.matches[0]).toMatchObject({ start: 0, end: 2, value: "ab" });
    expect(result.matches[0].groups[0].value).toBe("b");
  });

  it("returns one match without the global flag, rather than looping forever", () => {
    const result = runRegex("a", "", "aaa");
    expect(result.ok && result.matches).toHaveLength(1);
  });

  it("lists named groups by name", () => {
    const result = runRegex("(?<year>\\d{4})-(?<month>\\d{2})", "", "2026-08");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches[0].groups.map((g) => [g.name, g.value])).toEqual([
      ["year", "2026"],
      ["month", "08"],
    ]);
  });

  it("steps past a zero-length match instead of hanging", () => {
    const result = runRegex("a*", "g", "bb");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches.length).toBeLessThan(10);
  });

  it("stops at a thousand matches and says it stopped", () => {
    const result = runRegex(".", "g", "x".repeat(5000));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches).toHaveLength(1000);
    expect(result.truncated).toBe(true);
  });

  it("explains a pattern that will not compile", () => {
    const result = compile("(unclosed", "");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("splits the test string into matched and unmatched runs that rebuild it", () => {
    const found = runRegex("b+", "g", "abbbcabb");
    if (!found.ok) throw new Error("expected a match");
    const pieces = highlight("abbbcabb", found.matches);
    expect(pieces.map((p) => p.text).join("")).toBe("abbbcabb");
    expect(pieces.filter((p) => p.matched).map((p) => p.text)).toEqual(["bbb", "bb"]);
  });

  it("handles a unicode pattern", () => {
    const result = runRegex("\\p{Script=Arabic}+", "gu", URDU);
    expect(result.ok && result.matches.length).toBeGreaterThan(3);
  });
});

describe("diff", () => {
  it("numbers the lines each side would show", () => {
    const { rows } = lineDiff("a\nb\nc", "a\nx\nc");
    expect(rows.map((r) => [r.kind, r.leftNumber, r.rightNumber, r.text])).toEqual([
      ["same", 1, 1, "a"],
      ["removed", 2, null, "b"],
      ["added", null, 2, "x"],
      ["same", 3, 3, "c"],
    ]);
  });

  it("counts what changed", () => {
    const { summary } = lineDiff("a\nb", "a\nb\nc\nd");
    expect(summary).toEqual({ added: 2, removed: 0, unchanged: 2 });
  });

  it("does not report a trailing newline as a change", () => {
    const { summary } = lineDiff("a\nb\n", "a\nb");
    expect(summary.added + summary.removed).toBe(0);
  });

  it("does not report a Windows file as entirely different from a Unix one", () => {
    const { summary } = lineDiff("a\r\nb\r\nc", "a\nb\nc");
    expect(summary.added + summary.removed).toBe(0);
  });

  it("emits no phantom blank row for the final newline", () => {
    const { rows } = lineDiff("a\n", "a\n");
    expect(rows).toHaveLength(1);
  });

  it("finds the one changed word in a paragraph rather than the whole paragraph", () => {
    const { pieces, summary } = wordDiff(
      "the quick brown fox jumps",
      "the quick red fox jumps",
    );
    expect(summary.added).toBe(1);
    expect(summary.removed).toBe(1);
    expect(pieces.filter((p) => p.kind === "added").map((p) => p.text.trim())).toEqual(["red"]);
    expect(pieces.map((p) => p.text).join("")).toContain("the quick");
  });

  it("says plainly when the two sides are the same", () => {
    expect(describeSummary({ added: 0, removed: 0, unchanged: 3 }, "line")).toBe(
      "The two sides are identical.",
    );
    expect(describeSummary({ added: 1, removed: 2, unchanged: 0 }, "line")).toBe(
      "1 line added, 2 lines removed.",
    );
  });
});

describe("timestamps", () => {
  it("tells seconds from milliseconds by the size of the number", () => {
    expect(guessUnit(1_700_000_000)).toBe("seconds");
    expect(guessUnit(1_700_000_000_000)).toBe("milliseconds");
    expect(guessUnit(0)).toBe("seconds");
  });

  it("parses a stamp in either unit and lands on the same instant", () => {
    const seconds = parseStamp("1516242622");
    const millis = parseStamp("1516242622000");
    expect(seconds?.date.toISOString()).toBe("2018-01-18T02:30:22.000Z");
    expect(millis?.date.toISOString()).toBe("2018-01-18T02:30:22.000Z");
    expect(seconds?.unit).toBe("seconds");
    expect(millis?.unit).toBe("milliseconds");
  });

  it("can be told the unit rather than guessing", () => {
    expect(parseStamp("1000", "milliseconds")?.date.toISOString()).toBe("1970-01-01T00:00:01.000Z");
    expect(parseStamp("1000", "seconds")?.date.toISOString()).toBe("1970-01-01T00:16:40.000Z");
  });

  it("ignores the separators people paste in", () => {
    expect(parseStamp("1,516,242,622")?.date.toISOString()).toBe("2018-01-18T02:30:22.000Z");
  });

  it("refuses what is not a number", () => {
    expect(parseStamp("")).toBeNull();
    expect(parseStamp("tomorrow")).toBeNull();
    expect(parseStamp("12.5")).toBeNull();
  });

  it("reads a typed date as local midnight, not UTC midnight", () => {
    const date = parseLocalDateTime("2026-08-21");
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(21);
    expect(date?.getHours()).toBe(0);
  });

  it("refuses a date that does not exist rather than rolling it forward", () => {
    expect(parseLocalDateTime("2026-02-31")).toBeNull();
    expect(parseLocalDateTime("2026-13-01")).toBeNull();
    expect(parseLocalDateTime("nonsense")).toBeNull();
  });

  it("writes UTC as ISO 8601 to the second", () => {
    expect(toIsoUtc(new Date("2018-01-18T02:30:22.500Z"))).toBe("2018-01-18T02:30:22Z");
  });

  it("round trips through unix seconds", () => {
    const date = new Date(2026, 7, 21, 14, 30, 0);
    expect(new Date(toUnixSeconds(date) * 1000).getTime()).toBe(date.getTime());
  });

  it("writes local time in a fixed, sortable shape", () => {
    expect(toLocalString(new Date(2026, 7, 5, 9, 8, 7))).toBe("2026-08-05 09:08:07");
  });

  it("has a timezone name to label the local column with", () => {
    expect(localZoneName().length).toBeGreaterThan(0);
  });

  it("phrases the distance both ways", () => {
    const now = Date.parse("2026-08-21T12:00:00Z");
    expect(relative(new Date("2026-08-21T11:59:50Z"), now)).toBe("just now");
    expect(relative(new Date("2026-08-21T11:00:00Z"), now)).toBe("1 hour ago");
    expect(relative(new Date("2026-08-21T09:00:00Z"), now)).toBe("3 hours ago");
    expect(relative(new Date("2026-08-19T12:00:00Z"), now)).toBe("2 days ago");
    expect(relative(new Date("2026-08-22T12:00:00Z"), now)).toBe("in 1 day");
    expect(relative(new Date("2027-08-21T12:00:00Z"), now)).toBe("in 1 year");
  });
});
