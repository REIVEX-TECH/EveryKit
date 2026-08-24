"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square as Stop } from "lucide-react";

/**
 * Read text aloud with the browser's own speech synthesis.
 *
 * There is no gate here and no download button, and both absences are on
 * purpose. Nothing is taken: the sound plays through the speakers and is never
 * turned into a file, because browsers do not offer a reliable way to capture
 * synthesized speech to audio, and a download button that sometimes produced
 * silence would be worse than none. The voices are the ones installed on the
 * device, so the list differs from phone to phone, and none of the text leaves
 * the device to be spoken.
 */
export function ReadAloud() {
  const [supported, setSupported] = useState(true);
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceUri, setVoiceUri] = useState<string>("");
  const [rate, setRate] = useState(1);
  const [pitch, setPitch] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      return;
    }
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      setVoices(list);
      // Default to the first voice in the page's language, else the first at all.
      setVoiceUri((current) => {
        if (current && list.some((v) => v.voiceURI === current)) return current;
        const preferred = list.find((v) => v.lang.startsWith(navigator.language.slice(0, 2)));
        return (preferred ?? list[0])?.voiceURI ?? "";
      });
    };
    load();
    // Some browsers fill the list asynchronously and fire this event.
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  function play() {
    if (!supported || text.trim() === "") return;
    const synth = window.speechSynthesis;
    // Resume rather than restart if we are paused mid-utterance.
    if (synth.paused && synth.speaking) {
      synth.resume();
      setPaused(false);
      return;
    }
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === voiceUri);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
    };
    utterRef.current = utterance;
    synth.speak(utterance);
    setSpeaking(true);
    setPaused(false);
  }

  function pause() {
    if (!supported) return;
    window.speechSynthesis.pause();
    setPaused(true);
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }

  if (!supported) {
    return (
      <div className="ek-card p-4">
        <p className="text-[15px] text-text-light">
          This browser does not offer speech synthesis, so reading aloud is not available here.
          Chrome, Edge and Safari all support it, on both desktop and phone.
        </p>
      </div>
    );
  }

  const fieldClass =
    "w-full rounded-[10px] border border-line bg-background px-3 py-2 text-[15px] outline-none focus:border-primary";

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste the text to read aloud."
        className={`${fieldClass} min-h-[180px] leading-relaxed`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="voice" className="block text-[14px] font-semibold">
            Voice
          </label>
          <select
            id="voice"
            value={voiceUri}
            onChange={(e) => setVoiceUri(e.target.value)}
            className={`mt-1 ${fieldClass}`}
          >
            {voices.length === 0 ? <option value="">Loading voices…</option> : null}
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="rate" className="block text-[14px] font-semibold">
            Speed, {rate.toFixed(1)}x
          </label>
          <input
            id="rate"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-primary)]"
          />
        </div>
        <div>
          <label htmlFor="pitch" className="block text-[14px] font-semibold">
            Pitch, {pitch.toFixed(1)}
          </label>
          <input
            id="pitch"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={pitch}
            onChange={(e) => setPitch(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {speaking && !paused ? (
          <button type="button" onClick={pause} className="ek-btn ek-btn-accent">
            <Pause aria-hidden="true" className="h-4 w-4" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            disabled={text.trim() === ""}
            className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play aria-hidden="true" className="h-4 w-4" />
            {paused ? "Resume" : "Play"}
          </button>
        )}
        <button
          type="button"
          onClick={stop}
          disabled={!speaking}
          className="ek-btn ek-btn-quiet disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Stop aria-hidden="true" className="h-4 w-4" />
          Stop
        </button>
      </div>

      <p className="text-[13px] text-text-light">
        The voices are the ones installed on your device, so the list is different on each phone and
        computer. The sound plays here and is not saved to a file: browsers have no reliable way to
        record synthesized speech, so there is no download rather than one that might hand you
        silence.
      </p>
    </div>
  );
}
