"use client";

import { FREE_BYTES_LIMIT, FREE_FILE_LIMIT } from "@/data/tools";

/** A file the user picked, held in memory with its bytes read once. */
export type PickedFile = {
  /** Stable across reorders, which is what React keys off. */
  id: string;
  name: string;
  size: number;
  type: string;
  bytes: Uint8Array;
};

let nextFileId = 1;

export async function readPicked(file: File): Promise<PickedFile> {
  const buffer = await file.arrayBuffer();
  return {
    id: `f${nextFileId++}`,
    name: file.name,
    size: file.size,
    type: file.type,
    bytes: new Uint8Array(buffer),
  };
}

/** "2.4 MB" — one decimal place, which is as much as anyone reads. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} kB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

/** A percentage change, phrased as the direction it actually went. */
export function describeChange(before: number, after: number): string {
  if (before === 0) return "";
  const delta = ((before - after) / before) * 100;
  if (delta >= 0.5) return `${delta.toFixed(0)}% smaller`;
  if (delta <= -0.5) return `${Math.abs(delta).toFixed(0)}% larger`;
  return "about the same size";
}

/** Strip the extension so a result can be named after its source. */
export function baseName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = dot > 0 ? name.slice(0, dot) : name;
  return stem.trim() || "document";
}

export type LimitCheck = { overLimit: boolean; reason: string | null };

/**
 * Whether a selection is past the free limits.
 *
 * These are the honest reason for the paywall: past twenty files or 60 MB the
 * work is heavy enough that it is a different kind of job. Nothing is
 * watermarked and nothing is degraded below the line - it is a size gate, not a
 * quality one, because degrading someone's document to sell them the good
 * version is not something this kit does.
 */
export function checkLimits(files: PickedFile[]): LimitCheck {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (files.length > FREE_FILE_LIMIT) {
    return {
      overLimit: true,
      reason: `${files.length} files at once is past the free limit of ${FREE_FILE_LIMIT}.`,
    };
  }
  if (total > FREE_BYTES_LIMIT) {
    return {
      overLimit: true,
      reason: `${formatBytes(total)} is past the free limit of ${formatBytes(FREE_BYTES_LIMIT)}.`,
    };
  }
  return { overLimit: false, reason: null };
}

/**
 * Files dropped on the landing page, waiting for the tool they were sent to.
 *
 * Module scope survives a client-side navigation but not a reload, which is
 * exactly right: someone who lands directly on /merge should see an empty
 * dropzone, not files they do not remember choosing.
 */
let handoff: PickedFile[] = [];

export function stashFiles(files: PickedFile[]): void {
  handoff = files;
}

export function takeStashedFiles(): PickedFile[] {
  const files = handoff;
  handoff = [];
  return files;
}
