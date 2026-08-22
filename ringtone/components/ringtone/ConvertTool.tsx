"use client";

import { useRef, useState } from "react";
import { Download, Music } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { decodeAudio, downloadBlob, encodeMp3 } from "@/lib/ringtone/encode";
import { formatTime } from "@/lib/ringtone/audio";

const ACCEPT = "audio/*,.mp3,.m4a,.wav,.ogg,.oga,.aac,.flac,.webm";

type Loaded = { file: File; buffer: AudioBuffer };

/**
 * Convert an audio file to MP3.
 *
 * Decoding leans on the browser's own decoder, so what it accepts is what the
 * browser accepts: WAV and MP3 everywhere, M4A/AAC and OGG on most, FLAC on
 * some. The copy says this plainly rather than listing formats it cannot
 * promise. The output is always MP3, which is what a ringtone and most players
 * want, encoded on this device with lamejs.
 */
export function ConvertTool() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ blob: Blob; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function pick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const buffer = await decodeAudio(file);
      setLoaded({ file, buffer });
    } catch {
      setError(
        "This file could not be decoded in your browser. WAV and MP3 always work; M4A and OGG work in most browsers. Try one of those.",
      );
      setLoaded(null);
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    if (!loaded) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const { buffer } = loaded;
      const channels: Float32Array[] = [];
      for (let i = 0; i < Math.min(2, buffer.numberOfChannels); i++) {
        channels.push(buffer.getChannelData(i));
      }
      const blob = await encodeMp3(channels, buffer.sampleRate, setProgress);
      const name = loaded.file.name.replace(/\.[^.]+$/, "") + ".mp3";
      setResult({ blob, name });
    } catch {
      setError("Something went wrong while converting that file.");
    } finally {
      setBusy(false);
    }
  }

  function take(action: () => void) {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void pick(e.dataTransfer.files?.[0]);
        }}
        className="ek-card flex flex-col items-center gap-3 border-dashed p-8 text-center"
      >
        <Music aria-hidden="true" className="h-8 w-8 text-text-light" />
        <p className="text-[16px]">{loaded ? loaded.file.name : "Drop an audio file here, or"}</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="ek-btn ek-btn-accent">
          {loaded ? "Choose a different file" : "Choose a file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          aria-label="Choose an audio file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <p className="text-[13px] text-text-light">
          WAV and MP3 always decode; M4A and OGG in most browsers. It stays on your device.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {loaded ? (
        <>
          <p className="text-[14px] text-text-light">
            {loaded.buffer.numberOfChannels === 1 ? "Mono" : "Stereo"}, {formatTime(loaded.buffer.duration)},{" "}
            {Math.round(loaded.buffer.sampleRate / 100) / 10} kHz. It will be saved as an MP3.
          </p>
          <div>
            <button type="button" onClick={convert} disabled={busy} className="ek-btn ek-btn-accent disabled:opacity-50">
              {busy ? `Converting, ${progress}%` : "Convert to MP3"}
            </button>
          </div>
        </>
      ) : null}

      {result ? (
        <div className="ek-card p-4">
          <p className="text-[15px]">Your MP3 is ready.</p>
          <button
            type="button"
            onClick={() => take(() => downloadBlob(result.blob, result.name))}
            className="ek-btn ek-btn-accent mt-3"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download the MP3
          </button>
          {gateFor ? (
            <EmailGate
              actionLabel="Download"
              onDone={() => {
                gateFor();
                setGateFor(null);
              }}
              onCancel={() => setGateFor(null)}
            />
          ) : null}
          <MoreFromEveryKit />
        </div>
      ) : null}
    </div>
  );
}
