"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Music } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { MoreFromEveryKit } from "@/components/site/MoreFromEveryKit";
import { hasGivenEmail } from "@/lib/emailCapture";
import { applyFades, FADE_SECONDS, formatTime } from "@/lib/ringtone/audio";
import { applyGain, clippedFraction, maxCleanGain, percentToGain } from "@/lib/ringtone/gain";
import { decodeAudio, downloadBlob, encodeMp3 } from "@/lib/ringtone/encode";

const ACCEPT = "audio/*,.mp3,.m4a,.wav,.ogg,.oga,.aac,.flac,.webm";

type Loaded = { file: File; buffer: AudioBuffer };

/**
 * Change a clip's loudness, with a warning before it clips, and optional fades.
 *
 * The clipping warning is the point: turning the gain past what the samples can
 * hold does not make it louder, it distorts it, and the encoder would clamp it
 * silently. So the tool measures how much would clip at the chosen gain from the
 * real samples and says so, and offers the loudest setting that stays clean.
 */
export function VolumeTool() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [percent, setPercent] = useState(100);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
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
    setPercent(100);
    setBusy(true);
    try {
      const buffer = await decodeAudio(file);
      setLoaded({ file, buffer });
    } catch {
      setError("This file could not be decoded in your browser. WAV and MP3 always work; M4A and OGG in most.");
      setLoaded(null);
    } finally {
      setBusy(false);
    }
  }

  // The clipping estimate uses the first channel, which is enough to warn on.
  const gain = percentToGain(percent);
  const clip = useMemo(() => {
    if (!loaded) return { fraction: 0, cleanPercent: 100 };
    const ch = loaded.buffer.getChannelData(0);
    return {
      fraction: clippedFraction(ch, gain),
      cleanPercent: Math.floor(maxCleanGain(ch) * 100),
    };
  }, [loaded, gain]);

  async function render() {
    if (!loaded) return;
    setBusy(true);
    setProgress(0);
    setError(null);
    try {
      const { buffer } = loaded;
      const channels: Float32Array[] = [];
      for (let i = 0; i < Math.min(2, buffer.numberOfChannels); i++) {
        const gained = applyGain(buffer.getChannelData(i), gain).channel;
        channels.push(applyFades(gained, buffer.sampleRate, fadeIn, fadeOut));
      }
      const blob = await encodeMp3(channels, buffer.sampleRate, setProgress);
      const name = loaded.file.name.replace(/\.[^.]+$/, "") + "-adjusted.mp3";
      setResult({ blob, name });
    } catch {
      setError("Something went wrong while adjusting that file.");
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

  const willClip = clip.fraction > 0.0005;

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
        <p className="text-[13px] text-text-light">Saved as MP3. It stays on your device.</p>
      </div>

      {error ? (
        <p role="alert" className="text-[14px] text-warn">
          {error}
        </p>
      ) : null}

      {loaded ? (
        <>
          <div>
            <label htmlFor="vol" className="block text-[14px] font-semibold">
              Volume: {percent}%
            </label>
            <input
              id="vol"
              type="range"
              min={0}
              max={300}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="mt-2 w-full max-w-[420px] accent-[var(--color-primary)]"
            />
            <p className="mt-1 text-[13px] text-text-light">
              100% leaves it unchanged. Below halves it; above makes it louder, up to the point it
              starts to clip.
            </p>
            {willClip ? (
              <p role="alert" className="mt-2 text-[14px] text-warn">
                At {percent}% about {Math.round(clip.fraction * 100)}% of the audio would clip and
                distort. The loudest clean setting is around {clip.cleanPercent}%.{" "}
                <button
                  type="button"
                  onClick={() => setPercent(clip.cleanPercent)}
                  className="underline hover:text-primary-dark"
                >
                  Use {clip.cleanPercent}%
                </button>
              </p>
            ) : null}
          </div>

          <fieldset>
            <legend className="text-[14px] font-semibold">Fades</legend>
            <div className="mt-2 flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" checked={fadeIn} onChange={(e) => setFadeIn(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
                Fade in over {FADE_SECONDS} seconds
              </label>
              <label className="flex items-center gap-2 text-[14px]">
                <input type="checkbox" checked={fadeOut} onChange={(e) => setFadeOut(e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
                Fade out over {FADE_SECONDS} seconds
              </label>
            </div>
          </fieldset>

          <div>
            <button type="button" onClick={render} disabled={busy} className="ek-btn ek-btn-accent disabled:opacity-50">
              {busy ? `Working, ${progress}%` : "Apply and save as MP3"}
            </button>
            <p className="mt-1 text-[13px] text-text-light">{formatTime(loaded.buffer.duration)} of audio.</p>
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
