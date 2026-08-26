import { describe, expect, it } from "vitest";
import { tokenize, parseCurl } from "./curl";
import { toFetch, toAxios, toPython } from "./curlGen";

function parse(cmd: string) {
  const r = parseCurl(cmd);
  if ("error" in r) throw new Error(r.error);
  return r.parsed;
}

describe("tokenize", () => {
  it("splits on whitespace and respects quotes", () => {
    expect(tokenize(`curl -H "Content-Type: application/json" 'https://a.b/c'`)).toEqual([
      "curl",
      "-H",
      "Content-Type: application/json",
      "https://a.b/c",
    ]);
  });

  it("handles a line continuation", () => {
    expect(tokenize("curl \\\n  https://a.b")).toEqual(["curl", "https://a.b"]);
  });
});

describe("parseCurl", () => {
  it("reads a plain GET", () => {
    const p = parse("curl https://api.test/users");
    expect(p.method).toBe("GET");
    expect(p.url).toBe("https://api.test/users");
  });

  it("defaults to POST when there is a body, and keeps headers and data", () => {
    const p = parse(`curl -H "Content-Type: application/json" -d '{"a":1}' https://api.test/x`);
    expect(p.method).toBe("POST");
    expect(p.headers).toContainEqual(["Content-Type", "application/json"]);
    expect(p.data).toBe('{"a":1}');
  });

  it("honours an explicit method and basic auth", () => {
    const p = parse("curl -X PUT -u alice:secret https://api.test/x");
    expect(p.method).toBe("PUT");
    expect(p.auth).toEqual({ user: "alice", password: "secret" });
  });

  it("joins multiple data flags and adds a json content type for --json", () => {
    const p = parse(`curl --json '{"a":1}' https://api.test/x`);
    expect(p.json).toBe(true);
    expect(p.headers).toContainEqual(["Content-Type", "application/json"]);
  });

  it("moves data to the query string with -G", () => {
    const p = parse("curl -G -d q=hello https://api.test/search");
    expect(p.method).toBe("GET");
    expect(p.url).toBe("https://api.test/search?q=hello");
    expect(p.data).toBeNull();
  });

  it("collects unsupported flags rather than dropping them silently", () => {
    const p = parse("curl --compressed -F file=@x.png https://api.test/upload");
    expect(p.unsupported.some((u) => u.includes("--compressed"))).toBe(true);
    expect(p.unsupported.some((u) => u.includes("--form"))).toBe(true);
  });

  it("errors when there is no URL", () => {
    expect(parseCurl("curl -X POST")).toHaveProperty("error");
  });
});

describe("generators", () => {
  const p = parse(`curl -X POST -H "Content-Type: application/json" -d '{"a":1}' https://api.test/x`);

  it("produce fetch with method, headers and body", () => {
    const code = toFetch(p);
    expect(code).toContain('fetch("https://api.test/x"');
    expect(code).toContain('method: "POST"');
    expect(code).toContain('"Content-Type": "application/json"');
    expect(code).toContain('body: "{\\"a\\":1}"');
  });

  it("produce axios with a lowercased method", () => {
    expect(toAxios(p)).toContain('method: "post"');
    expect(toAxios(p)).toContain('url: "https://api.test/x"');
  });

  it("produce python requests with the right function", () => {
    const code = toPython(p);
    expect(code).toContain("import requests");
    expect(code).toContain("requests.post(");
    expect(code).toContain('data="{\\"a\\":1}"');
  });

  it("encode basic auth as a header for fetch and a tuple for python", () => {
    const a = parse("curl -u alice:secret https://api.test/x");
    expect(toFetch(a)).toContain("Authorization");
    expect(toPython(a)).toContain('auth=("alice", "secret")');
  });
});
