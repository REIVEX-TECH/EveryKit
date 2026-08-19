"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Music } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { revealResult } from "@/lib/revealResult";
import {
  applyFades,
  formatTime,
  MAX_SECONDS,
  normaliseSelection,
  outputFilename,
  peaks,
  selectionSamples,
  sliceChannel,
  type Peak,
  type Selection,
} from "@/lib/ringtone/audio";
import { BITRATE, decodeAudio, downloadBlob, encodeMp3 } from "@/lib/ringtone/encode";

const ACCEPT = "audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/wave,.mp3,.m4a,.wav";
const WAVE_HEIGHT = 140;

type Loaded = {
  file: File;
  buffer: AudioBuffer;
  /** One summary per drawn column, from the first channel. */
  summary: Peak[];
};

export function Workbench() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selection, setSelection] = useState<Selection>({ start: 0, end: 30 });
  const [fadeIn, setFadeIn] = useState(true);
  const [fadeOut, setFadeOut] = useState(true);
  const [busy, setBusy] = useState<"decoding" | "encoding" | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; seconds: number; url: string } | null>(
    null,
  );
  const [gateFor, setGateFor] = useState<(() => void) | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<"start" | "end" | null>(null);

  const duration = loaded?.buffer.duration ?? 0;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !loaded) return;
    const box = canvas.getBoundingClientRect();
    if (box.width < 1) return;

    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const width = Math.round(box.width * dpr);
    const height = Math.round(WAVE_HEIGHT * dpr);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.width, WAVE_HEIGHT);

    const middle = WAVE_HEIGHT / 2;
    const columns = loaded.summary.length;
    const step = box.width / columns;

    for (let i = 0; i < columns; i++) {
      const at = (i / columns) * duration;
      const inside = at >= selection.start && at <= selection.end;
      ctx.fillStyle = inside ? "#1769d4" : "#cbd5e1";

      const { min, max } = loaded.summary[i];
      const top = middle - max * (middle - 6);
      const bottom = middle - min * (middle - 6);
      ctx.fillRect(i * step, top, Math.max(1, step - 0.5), Math.max(1, bottom - top));
    }
  }, [loaded, selection, duration]);

  useEffect(() => {
    draw();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  async function onFile(file: File) {
    setError(null);
    clearResult();
    setBusy("decoding");
    try {
      const buffer = await decodeAudio(file);
      const summary = peaks(buffer.getChannelData(0), 600);
      setLoaded({ file, buffer, summary });
      setSelection(
        normaliseSelection({ start: 0, end: Math.min(30, buffer.duration) }, buffer.duration),
      );
    } catch {
      setError(
        "That file could not be read as audio. MP3, M4A and WAV work; a DRM protected track from a store will not.",
      );
    } finally {
      setBusy(null);
    }
  }

  const timeAt = (clientX: number) => {
    const rect = stageRef.current!.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return Math.min(Math.max(ratio, 0), 1) * duration;
  };

  const onPointerDown = (event: React.PointerEvent, handle: "start" | "end") => {
    event.preventDefault();
    // The drag is armed before the capture is attempted, not after.
    // setPointerCapture throws when the browser does not know the pointer id,
    // and with the order the other way round that exception left the handle
    // dead: the pointer moved, nothing was being dragged, and the only clue was
    // an error in the console.
    dragRef.current = handle;
    try {
      (event.target as Element).setPointerCapture?.(event.pointerId);
    } catch {
      // Without capture the drag still works while the pointer is over the
      // stage, which is where it spends nearly all of its time.
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    // Which handle is moving is read here and closed over, not read inside the
    // updater below. React runs updaters when it renders, not when they are
    // queued, and by then the pointer may have been released or the other
    // handle grabbed: a move meant for the start handle would then be applied
    // to the end one, and the start would snap back to where it was.
    const handle = dragRef.current;
    if (!handle || !loaded) return;

    const at = timeAt(event.clientX);
    setSelection((current) =>
      normaliseSelection(
        handle === "start" ? { ...current, start: at } : { ...current, end: at },
        duration,
      ),
    );
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const clearResult = useCallback(() => {
    setResult((previous) => {
      if (previous) URL.revokeObjectURL(previous.url);
      return null;
    });
  }, []);

  function take(action: () => void) {
    if (hasGivenEmail()) {
      action();
      return;
    }
    setGateFor(() => action);
  }

  async function makeRingtone() {
    if (!loaded) return;
    setBusy("encoding");
    setProgress(0);
    setError(null);
    try {
      const { buffer } = loaded;
      const { from, to } = selectionSamples(selection, buffer.sampleRate, buffer.length);

      const channels: Float32Array[] = [];
      for (let index = 0; index < Math.min(2, buffer.numberOfChannels); index++) {
        const cut = sliceChannel(buffer.getChannelData(index), from, to);
        channels.push(applyFades(cut, buffer.sampleRate, fadeIn, fadeOut));
      }

      const blob = await encodeMp3(channels, buffer.sampleRate, setProgress);
      // The URL is made once and released when it is replaced. Building it in
      // the markup instead would mint a new one on every render and hold on to
      // a copy of the audio each time.
      setResult((previous) => {
        if (previous) URL.revokeObjectURL(previous.url);
        return {
          blob,
          seconds: (to - from) / buffer.sampleRate,
          url: URL.createObjectURL(blob),
        };
      });
      requestAnimationFrame(() => revealResult(resultRef.current));
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : "The MP3 could not be written on this device.",
      );
    } finally {
      setBusy(null);
    }
  }

  const startPercent = duration > 0 ? (selection.start / duration) * 100 : 0;
  const endPercent = duration > 0 ? (selection.end / duration) * 100 : 100;
  const length = selection.end - selection.start;

  return (
    <div className="flex flex-col gap-6">
      {!loaded ? (
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files[0];
            if (file) void onFile(file);
          }}
          className="ek-card flex flex-col items-center gap-3 border-dashed p-8 text-center"
        >
          <Music aria-hidden="true" className="h-8 w-8 text-text-light" />
          <p className="text-[16px]">Drop a song here, or</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ek-btn ek-btn-accent"
            disabled={busy !== null}
          >
            {busy === "decoding" ? "Opening" : "Choose a song"}
          </button>
          <input
            ref={inputRef}
            type="file"
            aria-label="Choose an audio file from your device"
            accept={ACCEPT}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
              event.target.value = "";
            }}
          />
          <p className="text-[13px] text-text-light">
            MP3, M4A or WAV. The file stays on your device.
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {loaded ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 truncate text-[14px] text-text-light">
              {loaded.file.name}, {formatTime(duration)}
            </p>
            <button
              type="button"
              onClick={() => {
                setLoaded(null);
                clearResult();
              }}
              className="ek-btn ek-btn-quiet py-2 text-[14px]"
            >
              Use a different song
            </button>
          </div>

          <div>
            <div
              ref={stageRef}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerLeave={endDrag}
              className="relative w-full overflow-hidden rounded-[var(--radius-card)] border border-line bg-bg-soft"
              style={{ height: WAVE_HEIGHT, touchAction: "none" }}
            >
              <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: WAVE_HEIGHT }}
                aria-label={`Waveform. Selected from ${formatTime(selection.start)} to ${formatTime(selection.end)}.`}
                role="img"
              />

              <Handle percent={startPercent} label="Start" onPointerDown={(e) => onPointerDown(e, "start")} />
              <Handle percent={endPercent} label="End" onPointerDown={(e) => onPointerDown(e, "end")} />
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="start" className="block text-[14px] font-semibold">
                  Start, {formatTime(selection.start)}
                </label>
                <input
                  id="start"
                  type="range"
                  min={0}
                  max={Math.max(0.1, duration)}
                  step={0.1}
                  value={selection.start}
                  onChange={(event) =>
                    setSelection((current) =>
                      normaliseSelection({ ...current, start: Number(event.target.value) }, duration),
                    )
                  }
                  className="mt-2 w-full accent-primary"
                />
              </div>
              <div>
                <label htmlFor="end" className="block text-[14px] font-semibold">
                  End, {formatTime(selection.end)}
                </label>
                <input
                  id="end"
                  type="range"
                  min={0}
                  max={Math.max(0.1, duration)}
                  step={0.1}
                  value={selection.end}
                  onChange={(event) =>
                    setSelection((current) =>
                      normaliseSelection({ ...current, end: Number(event.target.value) }, duration),
                    )
                  }
                  className="mt-2 w-full accent-primary"
                />
              </div>
            </div>

            <p className="mt-2 text-[14px] text-text-light">
              {length.toFixed(1)} seconds selected
              {length >= MAX_SECONDS ? `, which is the ${MAX_SECONDS} second limit` : ""}
            </p>
          </div>

          <fieldset>
            <legend className="text-[14px] font-semibold">Fades</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={fadeIn}
                  onChange={(event) => setFadeIn(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                Fade in over half a second
              </label>
              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={fadeOut}
                  onChange={(event) => setFadeOut(event.target.checked)}
                  className="h-4 w-4 accent-[var(--color-primary)]"
                />
                Fade out over half a second
              </label>
            </div>
          </fieldset>

          <div>
            <button
              type="button"
              onClick={() => void makeRingtone()}
              disabled={busy !== null}
              className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "encoding" ? `Writing, ${Math.round(progress * 100)}%` : "Make the ringtone"}
            </button>
            <p className="mt-2 text-[13px] text-text-light">
              Exported as MP3 at {BITRATE} kbps. The encoding runs off the main thread, so the
              page stays usable while it works.
            </p>
          </div>
        </>
      ) : null}

      {result ? (
        <div ref={resultRef} className="ek-card p-4">
          <h2 className="text-[18px]">Your ringtone</h2>
          <p className="mt-1 text-[14px] text-text-light">
            {result.seconds.toFixed(1)} seconds, {(result.blob.size / 1024).toFixed(0)} kB
          </p>
          <audio
            controls
            src={result.url}
            className="mt-3 w-full"
            aria-label="Listen to the ringtone before downloading"
          />
          <button
            type="button"
            onClick={() =>
              take(() => downloadBlob(result.blob, outputFilename(loaded?.file.name ?? "ringtone")))
            }
            className="ek-btn ek-btn-accent mt-4"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download the MP3
          </button>

          <p className="mt-3 text-[13px] text-text-light">
            On Android, save this and pick it in your sound settings. An iPhone will not
            take an MP3 as a ringtone: it wants a .m4r file put there through a computer,
            which a browser cannot do.
          </p>

          <MoreFromEveryKit />
        </div>
      ) : null}

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
    </div>
  );
}

function Handle({
  percent,
  label,
  onPointerDown,
}: {
  percent: number;
  label: string;
  onPointerDown: (event: React.PointerEvent) => void;
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      role="presentation"
      className="absolute top-0 flex h-full w-6 -translate-x-1/2 cursor-ew-resize items-start justify-center"
      style={{ left: `${percent}%` }}
    >
      <span className="h-full w-[3px] bg-primary-dark" />
      <span className="absolute top-1 rounded-full bg-primary-dark px-2 py-0.5 text-[11px] text-white">
        {label}
      </span>
    </div>
  );
}
