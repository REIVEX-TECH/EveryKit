"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Copy, Check, Mic, Square as Stop } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import { decodeToMono16k, transcribe, type TranscribeProgress } from "@/lib/text/transcribe";

export function TranscribeTool() {
  const [audio, setAudio] = useState<Float32Array | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [sourceName, setSourceName] = useState<string | null>(null);

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<TranscribeProgress | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [canRecord, setCanRecord] = useState(false);

  const [gateOpen, setGateOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => {
    setCanRecord(
      typeof navigator !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof MediaRecorder !== "undefined",
    );
  }, []);

  async function loadAudio(blob: Blob, name: string) {
    setError(null);
    setText(null);
    setBusy(true);
    setProgress({ status: "Reading the audio", progress: 1 });
    try {
      const samples = await decodeToMono16k(blob);
      setAudio(samples);
      setSeconds(samples.length / 16000);
      setSourceName(name);
    } catch {
      setError("That audio could not be read. Try a WAV, MP3, M4A or WebM file.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        void loadAudio(blob, "your recording");
      };
      mr.start();
      recorder.current = mr;
      setRecording(true);
    } catch {
      setError("The microphone could not be used. Check the browser's permission for this page.");
    }
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  async function run() {
    if (!audio) return;
    setBusy(true);
    setError(null);
    setText(null);
    setProgress({ status: "Loading the model", progress: 0 });
    try {
      const out = await transcribe(audio, (p) => setProgress(p));
      setText(out);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That could not be transcribed.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function doCopy() {
    if (text === null) return;
    void navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function take() {
    if (hasGivenEmail()) {
      doCopy();
      return;
    }
    setGateOpen(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="ek-btn ek-btn-quiet cursor-pointer">
          Choose an audio file
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void loadAudio(file, file.name);
              e.target.value = "";
            }}
          />
        </label>

        {canRecord ? (
          recording ? (
            <button type="button" onClick={stopRecording} className="ek-btn ek-btn-accent">
              <Stop aria-hidden="true" className="h-4 w-4" />
              Stop recording
            </button>
          ) : (
            <button type="button" onClick={() => void startRecording()} className="ek-btn ek-btn-quiet">
              <Mic aria-hidden="true" className="h-4 w-4" />
              Record from the mic
            </button>
          )
        ) : null}

        {audio ? (
          <span className="text-[13px] text-text-light">
            {sourceName}, {seconds.toFixed(1)} seconds
          </span>
        ) : null}
      </div>

      {audio ? (
        <div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={busy}
            className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {busy
              ? progress
                ? `${progress.status}… ${Math.round(progress.progress * 100)}%`
                : "Working…"
              : "Transcribe"}
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="ek-card border-danger/40 bg-danger/5 p-3 text-[14px] text-danger">
          {error}
        </p>
      ) : null}

      {text !== null ? (
        <div className="ek-card p-4 sm:p-5">
          <h2 className="text-[18px] font-semibold">{text === "" ? "No speech found" : "The transcript"}</h2>
          <p className="mt-1 text-[13px] text-text-light">
            {text === ""
              ? "No speech was picked up in that audio. A clearer recording usually helps."
              : "Check it against the audio before you rely on it. A small on-device model is good on clear English speech and weaker on noise, accents and crosstalk."}
          </p>
          {text !== "" ? (
            <>
              <textarea
                readOnly
                value={text}
                className="mt-3 h-48 w-full resize-y rounded-[10px] border border-line bg-background p-3 text-[14px] outline-none focus:border-primary"
              />
              <button type="button" onClick={take} className="ek-btn ek-btn-accent mt-3">
                {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
                {copied ? "Copied" : "Copy the transcript"}
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      <p className="text-[13px] text-text-light">
        The model is about 40 MB. It downloads from this site the first time you transcribe and is
        then cached, so later runs start quickly. Everything runs on your device, which is private
        but slower than a server would be, and this is a tiny English model: expect a good draft on
        clear speech, not a perfect transcript. Nothing you record or open is uploaded.
      </p>

      {gateOpen ? (
        <EmailGate
          actionLabel="Copy the transcript"
          onDone={() => {
            doCopy();
            setGateOpen(false);
          }}
          onCancel={() => setGateOpen(false)}
        />
      ) : null}
    </div>
  );
}
