/**
 * A weekly class timetable that lives in the link.
 *
 * Like the flashcard deck and the exam countdown, the whole schedule is encoded
 * into the URL, so nothing is stored on a server and sharing is sending a link.
 * The layout maths (which rows a class spans, how tall its block is) is pure and
 * tested, so the on-screen grid and the exported image agree by construction.
 */

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Block colours: dark enough for white text, and no purple, per the design rules. */
export const CLASS_COLORS = [
  "#1d81f2",
  "#0d9488",
  "#15803d",
  "#b45309",
  "#be123c",
  "#475569",
] as const;

export type ClassBlock = {
  id: string;
  /** 0 = Monday … 6 = Sunday. */
  day: number;
  /** Minutes from midnight. */
  start: number;
  end: number;
  name: string;
  location: string;
  color: string;
};

/** "09:00" or "9:0" to minutes from midnight, or null if it is not a time. */
export function parseTime(value: string): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Minutes from midnight to "9:00" / "14:30". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

/** A block is valid when it has a name and ends after it starts. */
export function isValidBlock(block: Pick<ClassBlock, "name" | "start" | "end" | "day">): boolean {
  return (
    block.name.trim() !== "" &&
    block.day >= 0 &&
    block.day <= 6 &&
    block.end > block.start
  );
}

/** The hour span the grid should show, from the classes in it. */
export function timeRange(blocks: ClassBlock[]): { startHour: number; endHour: number } {
  if (blocks.length === 0) return { startHour: 8, endHour: 18 };
  let min = Infinity;
  let max = -Infinity;
  for (const block of blocks) {
    min = Math.min(min, block.start);
    max = Math.max(max, block.end);
  }
  const startHour = Math.max(0, Math.floor(min / 60));
  const endHour = Math.min(24, Math.ceil(max / 60));
  return { startHour, endHour: Math.max(endHour, startHour + 1) };
}

/** Where a block sits in its day column, as fractions of the grid height. */
export function blockPosition(
  block: ClassBlock,
  range: { startHour: number; endHour: number },
): { top: number; height: number } {
  const total = (range.endHour - range.startHour) * 60;
  const top = (block.start - range.startHour * 60) / total;
  const height = (block.end - block.start) / total;
  return { top, height };
}

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSchedule(blocks: ClassBlock[]): string {
  const rows = blocks
    .filter(isValidBlock)
    .map((b) => [b.day, b.start, b.end, b.name, b.location, b.color]);
  return toBase64Url(JSON.stringify(rows));
}

export function decodeSchedule(param: string): ClassBlock[] {
  if (!param) return [];
  try {
    const parsed = JSON.parse(fromBase64Url(param));
    if (!Array.isArray(parsed)) return [];
    const blocks: ClassBlock[] = [];
    parsed.forEach((row, index) => {
      if (!Array.isArray(row) || row.length < 6) return;
      const [day, start, end, name, location, color] = row;
      if (typeof day !== "number" || typeof start !== "number" || typeof end !== "number") return;
      if (typeof name !== "string") return;
      const block: ClassBlock = {
        id: `b${index}`,
        day,
        start,
        end,
        name,
        location: typeof location === "string" ? location : "",
        color: typeof color === "string" ? color : CLASS_COLORS[0],
      };
      if (isValidBlock(block)) blocks.push(block);
    });
    return blocks;
  } catch {
    return [];
  }
}

export function scheduleFromQuery(search: string): ClassBlock[] {
  return decodeSchedule(new URLSearchParams(search).get("s") ?? "");
}

export function scheduleQuery(blocks: ClassBlock[]): string {
  const valid = blocks.filter(isValidBlock);
  return valid.length === 0 ? "" : `?s=${encodeSchedule(valid)}`;
}
