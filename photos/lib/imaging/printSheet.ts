/**
 * Layout for the 4 x 6 inch print sheet — the thing you hand to a pharmacy or
 * print kiosk. The layout maths is pure so it can be tested; the drawing half
 * takes a canvas context.
 */

import type { PhotoSpec } from "@/data/specs";

export type SheetPaper = {
  widthMm: number;
  heightMm: number;
  dpi: number;
  label: string;
};

/** 4 x 6 inches, the cheapest print size in almost every shop. */
export const SHEET_4X6: SheetPaper = {
  widthMm: 152.4,
  heightMm: 101.6,
  dpi: 300,
  label: "4 x 6 inch",
};

export const GUTTER_MM = 4;
export const MARGIN_MM = 5;

export type SheetLayout = {
  /** Sheet size in pixels at the sheet's DPI. */
  sheetWidthPx: number;
  sheetHeightPx: number;
  columns: number;
  rows: number;
  count: number;
  photoWidthPx: number;
  photoHeightPx: number;
  gutterPx: number;
  /** Top-left of the first photo, in sheet pixels. */
  originXPx: number;
  originYPx: number;
  /** True when the sheet was turned to fit more copies. */
  rotated: boolean;
  /** The spacing actually used, which may be tighter than the preferred one. */
  gutterMm: number;
  marginMm: number;
};

/**
 * Spacing options in order of preference. A 4 mm gutter is nicer to cut, but
 * three 2 x 2 inch photos across a 4 x 6 sheet come to exactly 6 inches, so
 * insisting on it would drop a whole column and hand the user two copies where
 * a print shop would give six. Tighter spacing is tried when it wins copies.
 */
const SPACING_OPTIONS: Array<{ gutterMm: number; marginMm: number }> = [
  { gutterMm: GUTTER_MM, marginMm: MARGIN_MM },
  { gutterMm: 3, marginMm: 3 },
  { gutterMm: 2, marginMm: 0 },
  { gutterMm: 0, marginMm: 0 },
];

function mmToPx(mm: number, dpi: number): number {
  return (mm / 25.4) * dpi;
}

function fitGrid(
  sheetWidthMm: number,
  sheetHeightMm: number,
  photoWidthMm: number,
  photoHeightMm: number,
  gutterMm: number,
  marginMm: number,
): { columns: number; rows: number } {
  const usableWidth = sheetWidthMm - 2 * marginMm;
  const usableHeight = sheetHeightMm - 2 * marginMm;
  // n photos take n*photo + (n-1)*gutter, so solve for n.
  const columns = Math.floor((usableWidth + gutterMm) / (photoWidthMm + gutterMm));
  const rows = Math.floor((usableHeight + gutterMm) / (photoHeightMm + gutterMm));
  return { columns: Math.max(0, columns), rows: Math.max(0, rows) };
}

/**
 * Work out how many copies fit on the sheet. Both paper orientations and each
 * spacing option are tried; the most copies wins, and the widest gutter breaks
 * a tie. The grid is centred on the paper.
 */
export function layoutPrintSheet(spec: PhotoSpec, paper: SheetPaper = SHEET_4X6): SheetLayout {
  let best: SheetLayout | null = null;
  for (const spacing of SPACING_OPTIONS) {
    const candidate = layoutWithSpacing(spec, paper, spacing.gutterMm, spacing.marginMm);
    if (!best || candidate.count > best.count) best = candidate;
  }
  return best!;
}

function layoutWithSpacing(
  spec: PhotoSpec,
  paper: SheetPaper,
  gutterMm: number,
  marginMm: number,
): SheetLayout {
  const landscape = fitGrid(
    paper.widthMm,
    paper.heightMm,
    spec.widthMm,
    spec.heightMm,
    gutterMm,
    marginMm,
  );
  const portrait = fitGrid(
    paper.heightMm,
    paper.widthMm,
    spec.widthMm,
    spec.heightMm,
    gutterMm,
    marginMm,
  );

  const usePortrait = portrait.columns * portrait.rows > landscape.columns * landscape.rows;
  const grid = usePortrait ? portrait : landscape;
  const sheetWidthMm = usePortrait ? paper.heightMm : paper.widthMm;
  const sheetHeightMm = usePortrait ? paper.widthMm : paper.heightMm;

  const sheetWidthPx = Math.round(mmToPx(sheetWidthMm, paper.dpi));
  const sheetHeightPx = Math.round(mmToPx(sheetHeightMm, paper.dpi));
  const photoWidthPx = mmToPx(spec.widthMm, paper.dpi);
  const photoHeightPx = mmToPx(spec.heightMm, paper.dpi);
  const gutterPx = mmToPx(gutterMm, paper.dpi);

  const blockWidth = grid.columns * photoWidthPx + Math.max(0, grid.columns - 1) * gutterPx;
  const blockHeight = grid.rows * photoHeightPx + Math.max(0, grid.rows - 1) * gutterPx;

  return {
    sheetWidthPx,
    sheetHeightPx,
    columns: grid.columns,
    rows: grid.rows,
    count: grid.columns * grid.rows,
    photoWidthPx,
    photoHeightPx,
    gutterPx,
    originXPx: (sheetWidthPx - blockWidth) / 2,
    originYPx: (sheetHeightPx - blockHeight) / 2,
    rotated: usePortrait,
    gutterMm,
    marginMm,
  };
}

/** Top-left corner of each photo cell, in sheet pixels. */
export function sheetCells(layout: SheetLayout): Array<{ x: number; y: number }> {
  const cells: Array<{ x: number; y: number }> = [];
  for (let row = 0; row < layout.rows; row++) {
    for (let col = 0; col < layout.columns; col++) {
      cells.push({
        x: layout.originXPx + col * (layout.photoWidthPx + layout.gutterPx),
        y: layout.originYPx + row * (layout.photoHeightPx + layout.gutterPx),
      });
    }
  }
  return cells;
}

const CUT_LINE_COLOR = "#cbd5e1";

/**
 * Draw the tiled sheet. `photo` is the finished single photo at any resolution;
 * it is scaled into each cell.
 */
export function drawPrintSheet(
  ctx: CanvasRenderingContext2D,
  photo: CanvasImageSource,
  layout: SheetLayout,
  options: { cutLines?: boolean } = {},
): void {
  const { cutLines = true } = options;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, layout.sheetWidthPx, layout.sheetHeightPx);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (const cell of sheetCells(layout)) {
    ctx.drawImage(photo, cell.x, cell.y, layout.photoWidthPx, layout.photoHeightPx);
  }

  if (!cutLines) return;

  // Hairline guides so scissors have something to follow. Drawn on the half
  // pixel so a 1px line stays 1px.
  ctx.strokeStyle = CUT_LINE_COLOR;
  ctx.lineWidth = 1;
  for (const cell of sheetCells(layout)) {
    ctx.strokeRect(
      Math.round(cell.x) + 0.5,
      Math.round(cell.y) + 0.5,
      Math.round(layout.photoWidthPx) - 1,
      Math.round(layout.photoHeightPx) - 1,
    );
  }
}
