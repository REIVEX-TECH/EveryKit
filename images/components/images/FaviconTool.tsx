"use client";

import { useCallback, useState } from "react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { context2d, decodeUpright, download, encodeCanvas, makeCanvas } from "@/lib/images/canvas";
import { buildIco, faviconHtml, ICON_SPECS } from "@/lib/images/favicon";
import { makeZip } from "@/lib/images/zip";
import { ImagePicker } from "./ImagePicker";

/** Draw the source into a square of `size`, padding a non-square image with white. */
async function renderSquarePng(bitmap: ImageBitmap, size: number): Promise<Uint8Array> {
  const canvas = makeCanvas(size, size);
  const ctx = context2d(canvas);
  // A favicon sits in a square. A rectangular source is fitted inside and
  // centred rather than stretched, on a white ground so a JPEG-flattened
  // source does not gain black bars.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, Math.round((size - w) / 2), Math.round((size - h) / 2), w, h);
  const blob = await encodeCanvas(canvas, "image/png", 1);
  return new Uint8Array(await blob.arrayBuffer());
}

export function FaviconTool() {
  const [file, setFile] = useState<File | null>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [square, setSquare] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  const pick = useCallback(async (picked: File) => {
    setError(null);
    setReady(false);
    try {
      const bmp = await decodeUpright(picked);
      setBitmap((old) => {
        old?.close();
        return bmp;
      });
      setSquare(Math.abs(bmp.width - bmp.height) <= 1);
      setFile(picked);
      setReady(true);
    } catch {
      setError("That image could not be read. A square PNG or JPG works best.");
    }
  }, []);

  const build = useCallback(async () => {
    if (!bitmap) throw new Error("No image.");
    const pngs = new Map<number, Uint8Array>();
    for (const spec of ICON_SPECS) {
      pngs.set(spec.size, await renderSquarePng(bitmap, spec.size));
    }
    const ico = buildIco(
      ICON_SPECS.filter((s) => s.inIco).map((s) => ({ size: s.size, png: pngs.get(s.size)! })),
    );

    const entries = [
      { name: "favicon.ico", bytes: ico },
      ...ICON_SPECS.map((s) => ({ name: s.name, bytes: pngs.get(s.size)! })),
      { name: "head-snippet.html", bytes: new TextEncoder().encode(faviconHtml() + "\n") },
    ];
    return makeZip(entries);
  }, [bitmap]);

  const save = useCallback(async () => {
    setBusy(true);
    try {
      const zip = await build();
      download(new Blob([zip as unknown as BlobPart], { type: "application/zip" }), "favicons.zip");
    } catch {
      setError("The icons could not be built. Try a different image.");
    } finally {
      setBusy(false);
    }
  }, [build]);

  function take() {
    if (hasGivenEmail()) {
      void save();
      return;
    }
    setGateOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <ImagePicker onPick={pick} current={file} label="Drop a square image here, or" />

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {ready && bitmap ? (
        <>
          {!square ? (
            <p className="ek-card bg-bg-soft p-3 text-[13px] text-text-light">
              This image is {bitmap.width} x {bitmap.height}, not square. It will be centred in a
              square with white to the sides. Crop it square first for an edge-to-edge icon.
            </p>
          ) : null}

          <div>
            <h2 className="text-[16px] font-semibold">What you will get</h2>
            <ul className="mt-2 flex flex-col gap-1 text-[14px] text-text-light">
              <li>favicon.ico, holding 16, 32 and 48 pixel versions in one file</li>
              {ICON_SPECS.map((spec) => (
                <li key={spec.size}>
                  {spec.name}, {spec.size}x{spec.size} px, {spec.purpose.toLowerCase()}
                </li>
              ))}
              <li>head-snippet.html, the lines to paste into your page</li>
            </ul>
          </div>

          <div>
            <button
              type="button"
              onClick={take}
              disabled={busy}
              className="ek-btn ek-btn-accent disabled:opacity-50"
            >
              {busy ? "Building…" : "Build the icons"}
            </button>
          </div>

          {gateOpen ? (
            <EmailGate
              actionLabel="Build and save"
              onDone={() => {
                setGateOpen(false);
                void save();
              }}
              onCancel={() => setGateOpen(false)}
            />
          ) : null}

          <MoreFromEveryKit />
        </>
      ) : null}
    </div>
  );
}
