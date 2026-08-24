"use client";

/**
 * Speech to text, entirely on the device, through transformers.js running a
 * quantized Whisper-tiny model.
 *
 * Everything is served from our own origin: the model weights live under
 * /models, and the ONNX runtime's WebAssembly under /ort. transformers.js is
 * told not to reach the Hugging Face hub (`allowRemoteModels = false`), so a
 * failed local file surfaces as an error rather than silently falling back to a
 * CDN. It runs single-threaded on purpose: multi-threaded WebAssembly needs
 * SharedArrayBuffer, which needs cross-origin isolation headers that would ripple
 * across the whole app and break the checkout frame, and tiny is fast enough
 * without it.
 *
 * The import is dynamic so the library, which is large, only loads on this one
 * page and only when a transcription is actually asked for.
 */

export type TranscribeProgress = { status: string; progress: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transcriber: any = null;

async function getTranscriber(onProgress?: (p: TranscribeProgress) => void) {
  if (transcriber) return transcriber;
  const { pipeline, env } = await import("@huggingface/transformers");

  env.allowRemoteModels = false;
  env.allowLocalModels = true;
  env.localModelPath = "/models/";
  const wasm = env.backends?.onnx?.wasm;
  if (wasm) {
    wasm.wasmPaths = "/ort/";
    // One thread: no SharedArrayBuffer, so no cross-origin-isolation headers.
    wasm.numThreads = 1;
  }

  transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
    dtype: "q8",
    progress_callback: (report: { status?: string; progress?: number; file?: string }) => {
      if (!onProgress) return;
      if (report.status === "progress" && typeof report.progress === "number") {
        onProgress({ status: "Loading the model", progress: report.progress / 100 });
      } else if (report.status === "ready") {
        onProgress({ status: "Ready", progress: 1 });
      }
    },
  });
  return transcriber;
}

/**
 * Decode any audio the browser can read into the 16 kHz mono float samples
 * Whisper expects, resampling through an offline audio context.
 */
export async function decodeToMono16k(blob: Blob): Promise<Float32Array> {
  const arrayBuffer = await blob.arrayBuffer();
  const AC: typeof AudioContext =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AC();
  try {
    const decoded = await context.decodeAudioData(arrayBuffer);
    const length = Math.max(1, Math.ceil(decoded.duration * 16000));
    const offline = new OfflineAudioContext(1, length, 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    void context.close();
  }
}

/** Transcribe 16 kHz mono samples to text. */
export async function transcribe(
  audio: Float32Array,
  onProgress?: (p: TranscribeProgress) => void,
): Promise<string> {
  const pipe = await getTranscriber(onProgress);
  onProgress?.({ status: "Listening", progress: 1 });
  const output = await pipe(audio, { chunk_length_s: 30, stride_length_s: 5 });
  const text = Array.isArray(output)
    ? output.map((part: { text: string }) => part.text).join(" ")
    : (output as { text: string }).text;
  return text.trim();
}
