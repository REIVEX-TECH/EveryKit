/**
 * Six preset colour pairs for the QR appearance panel.
 *
 * Every one is a dark module colour on a light background, and every one clears
 * the contrast check with room to spare, so a person picking a preset can never
 * land on a code that will not scan. The check is enforced in the tests, not
 * just intended here.
 */

import type { Colours } from "./render";

export type Palette = { id: string; name: string; colours: Colours };

export const PALETTES: Palette[] = [
  { id: "ink", name: "Ink", colours: { dark: "#171717", light: "#ffffff" } },
  { id: "navy", name: "Navy", colours: { dark: "#10233f", light: "#ffffff" } },
  { id: "forest", name: "Forest", colours: { dark: "#12402a", light: "#ffffff" } },
  { id: "plum", name: "Plum", colours: { dark: "#3b1338", light: "#ffffff" } },
  { id: "slate", name: "Slate", colours: { dark: "#1f2a37", light: "#f2f5f9" } },
  { id: "ocean", name: "Ocean", colours: { dark: "#0e4f8a", light: "#eef6ff" } },
];
