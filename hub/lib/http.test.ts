import { describe, expect, it } from "vitest";
import { readJsonObject } from "./http";

const JSON_TYPE = { "content-type": "application/json" };

function post(body: string, headers: Record<string, string> = JSON_TYPE): Request {
  return new Request("https://useeverykit.com/api/hit", {
    method: "POST",
    headers,
    body,
  });
}

/** A request whose body arrives in pieces and declares no length. */
function chunked(pieces: string[], headers: Record<string, string> = JSON_TYPE): Request {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
  return new Request("https://useeverykit.com/api/hit", {
    method: "POST",
    headers,
    body: stream,
    // Required by fetch when the body is a stream.
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("readJsonObject", () => {
  it("reads a small JSON object", async () => {
    const result = await readJsonObject(post('{"kit":"calc","path":"/emi"}'), 1024);
    expect(result).toEqual({ ok: true, body: { kit: "calc", path: "/emi" } });
  });

  it("refuses a body that is not declared as JSON", async () => {
    const result = await readJsonObject(post("{}", { "content-type": "text/plain" }), 1024);
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("refuses a body with no content type at all", async () => {
    const result = await readJsonObject(post("{}", {}), 1024);
    expect(result).toEqual({ ok: false, reason: "type" });
  });

  it("accepts a content type carrying parameters", async () => {
    const result = await readJsonObject(
      post("{}", { "content-type": "application/json; charset=utf-8" }),
      1024,
    );
    expect(result).toEqual({ ok: true, body: {} });
  });

  it("accepts a +json media type", async () => {
    const result = await readJsonObject(
      post('{"a":1}', { "content-type": "application/ld+json" }),
      1024,
    );
    expect(result).toEqual({ ok: true, body: { a: 1 } });
  });

  it("refuses a body longer than the cap", async () => {
    const big = JSON.stringify({ path: "x".repeat(2000) });
    const result = await readJsonObject(post(big), 1024);
    expect(result).toEqual({ ok: false, reason: "too-large" });
  });

  it("refuses an oversized body that declares no length", async () => {
    // The reason this function exists. A chunked request carries no
    // Content-Length, so the old check passed and the whole body was read.
    const result = await readJsonObject(chunked(['{"path":"', "y".repeat(5000), '"}']), 1024);
    expect(result).toEqual({ ok: false, reason: "too-large" });
  });

  it("reads a small chunked body normally", async () => {
    const result = await readJsonObject(chunked(['{"kit":', '"qr"}']), 1024);
    expect(result).toEqual({ ok: true, body: { kit: "qr" } });
  });

  it("counts bytes rather than characters", async () => {
    // Ten characters, forty bytes. A cap measured in characters would let this
    // through and a cap measured in bytes should not.
    const body = JSON.stringify({ p: "\u{1F600}".repeat(10) });
    expect(body.length).toBeLessThan(48);
    const result = await readJsonObject(post(body), 32);
    expect(result).toEqual({ ok: false, reason: "too-large" });
  });

  it("refuses text that is not JSON", async () => {
    const result = await readJsonObject(post("not json at all"), 1024);
    expect(result).toEqual({ ok: false, reason: "not-json" });
  });

  it("refuses JSON that is not an object", async () => {
    for (const body of ["[]", '"a string"', "42", "null", "true"]) {
      const result = await readJsonObject(post(body), 1024);
      expect(result).toEqual({ ok: false, reason: "not-json" });
    }
  });

  it("refuses bytes that are not valid UTF-8", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // A lone continuation byte, which no UTF-8 sequence may start with.
        controller.enqueue(new Uint8Array([0x7b, 0x80, 0x7d]));
        controller.close();
      },
    });
    const request = new Request("https://useeverykit.com/api/hit", {
      method: "POST",
      headers: JSON_TYPE,
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect(await readJsonObject(request, 1024)).toEqual({ ok: false, reason: "unreadable" });
  });

  it("refuses early when the declared length is over the cap", async () => {
    const request = new Request("https://useeverykit.com/api/hit", {
      method: "POST",
      headers: { ...JSON_TYPE, "content-length": "999999" },
      body: "{}",
    });
    expect(await readJsonObject(request, 1024)).toEqual({ ok: false, reason: "too-large" });
  });

  it("reads an empty body as unparseable rather than throwing", async () => {
    const result = await readJsonObject(post(""), 1024);
    expect(result).toEqual({ ok: false, reason: "not-json" });
  });
});
