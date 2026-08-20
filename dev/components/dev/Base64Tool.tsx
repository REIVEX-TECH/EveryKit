"use client";

import { useRef, useState } from "react";
import {
  bytesToBase64,
  decodeBase64,
  decodeBase64ToBytes,
  encodeBase64,
} from "@/lib/dev/encode";
import { CopyButton, DownloadButton, Note, TextBox } from "./ui";

type Mode = "encode" | "decode";
type Source = "text" | "file";

/**
 * Base64 both ways, for text and for files.
 *
 * The file side deliberately hands back a download rather than printing bytes
 * into a text box: decoding a base64 PNG produces bytes that are not text, and
 * showing them would fill the screen with replacement characters and lose the
 * file. Encoding a file, on the other hand, produces text, so that side shows.
 */
export function Base64Tool() {
  const [mode, setMode] = useState<Mode>("encode");
  const [source, setSource] = useState<Source>("text");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; base64: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const picker = useRef<HTMLInputElement>(null);

  function run(nextMode: Mode, text: string) {
    setError(null);
    if (text === "") {
      setOutput("");
      return;
    }
    if (nextMode === "encode") {
      setOutput(encodeBase64(text));
      return;
    }
    const result = decodeBase64(text);
    if (result.ok) {
      setOutput(result.text);
    } else {
      setOutput("");
      setError(result.message);
    }
  }

  async function onFile(picked: File) {
    setBusy(true);
    setError(null);
    try {
      const bytes = new Uint8Array(await picked.arrayBuffer());
      setFile({ name: picked.name, base64: bytesToBase64(bytes) });
    } catch {
      setError("That file could not be read.");
    } finally {
      setBusy(false);
    }
  }

  const decodedBytes = mode === "decode" && source === "file" ? decodeBase64ToBytes(input) : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-4">
        <fieldset>
          <legend className="text-[14px] font-semibold">Direction</legend>
          <div className="mt-2 flex gap-2">
            {(["encode", "decode"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => {
                  setMode(value);
                  setOutput("");
                  setError(null);
                  run(value, input);
                }}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                  mode === value
                    ? "bg-primary-dark text-white"
                    : "border border-line bg-background hover:border-line-strong"
                }`}
              >
                {value === "encode" ? "Encode" : "Decode"}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-[14px] font-semibold">Input</legend>
          <div className="mt-2 flex gap-2">
            {(["text", "file"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={source === value}
                onClick={() => {
                  setSource(value);
                  setError(null);
                }}
                className={`rounded-full px-4 py-2 text-[14px] font-semibold ${
                  source === value
                    ? "bg-primary-dark text-white"
                    : "border border-line bg-background hover:border-line-strong"
                }`}
              >
                {value === "text" ? "Text" : "File"}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {source === "text" ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label htmlFor="b64-in" className="block text-[14px] font-semibold">
              {mode === "encode" ? "Text" : "Base64"}
            </label>
            <TextBox
              id="b64-in"
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                run(mode, event.target.value);
              }}
              placeholder={mode === "encode" ? "Anything, in any language" : "aGVsbG8="}
              className="mt-2"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[14px] font-semibold">
                {mode === "encode" ? "Base64" : "Text"}
              </h2>
              {output !== "" ? (
                <CopyButton text={output} className="ek-btn ek-btn-accent px-4 py-2 text-[14px]" />
              ) : null}
            </div>
            <TextBox id="b64-out" readOnly value={output} className="mt-2 bg-bg-soft" />
            {error ? <Note tone="bad">{error}</Note> : null}
          </div>
        </div>
      ) : mode === "encode" ? (
        <div className="ek-card flex flex-col items-start gap-3 p-4">
          <button
            type="button"
            onClick={() => picker.current?.click()}
            className="ek-btn ek-btn-accent"
            disabled={busy}
          >
            {busy ? "Reading" : "Choose a file"}
          </button>
          <input
            ref={picker}
            type="file"
            aria-label="Choose a file to encode"
            className="sr-only"
            onChange={(event) => {
              const picked = event.target.files?.[0];
              if (picked) void onFile(picked);
              event.target.value = "";
            }}
          />
          <p className="text-[13px] text-text-light">
            The file is read in this page. Nothing is uploaded.
          </p>

          {file ? (
            <>
              <p className="text-[14px]">
                {file.name}, {file.base64.length.toLocaleString("en")} characters of base64
              </p>
              <TextBox readOnly value={file.base64} aria-label="Base64 of the chosen file" />
              <div className="flex gap-2">
                <CopyButton text={file.base64} />
                <DownloadButton
                  build={() => new Blob([file.base64], { type: "text/plain" })}
                  filename={`${file.name}.base64.txt`}
                  label="Save as .txt"
                />
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <label htmlFor="b64-file-in" className="block text-[14px] font-semibold">
            Base64
          </label>
          <TextBox
            id="b64-file-in"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste base64 and download what it decodes to"
          />
          {decodedBytes && decodedBytes.ok ? (
            <div className="flex flex-wrap items-center gap-3">
              <DownloadButton
                build={() => new Blob([decodedBytes.bytes as BlobPart], { type: "application/octet-stream" })}
                filename="decoded.bin"
                label="Download the file"
                className="ek-btn ek-btn-accent"
              />
              <span className="text-[13px] text-text-light">
                {decodedBytes.bytes.length.toLocaleString("en")} bytes. The extension is up to you:
                base64 does not carry the file type.
              </span>
            </div>
          ) : input.trim() !== "" && decodedBytes ? (
            <Note tone="bad">{decodedBytes.message}</Note>
          ) : null}
        </div>
      )}
    </div>
  );
}
