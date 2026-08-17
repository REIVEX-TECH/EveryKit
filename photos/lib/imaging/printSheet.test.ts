import { describe, expect, it } from "vitest";
import { GUTTER_MM, MARGIN_MM, SHEET_4X6, layoutPrintSheet, sheetCells } from "./printSheet";
import { getSpec, specs } from "@/data/specs";

const US = getSpec("us-passport")!;
const UK = getSpec("uk-passport")!;
const CA = getSpec("canada-passport")!;

describe("layoutPrintSheet", () => {
  it("renders the sheet at 4 x 6 inches, 300 DPI", () => {
    const layout = layoutPrintSheet(US);
    const long = Math.max(layout.sheetWidthPx, layout.sheetHeightPx);
    const short = Math.min(layout.sheetWidthPx, layout.sheetHeightPx);
    expect(long).toBe(1800);
    expect(short).toBe(1200);
  });

  it("fits six 2 x 2 inch photos on a 4 x 6 sheet, as a print shop would", () => {
    // Three 50.8 mm photos across come to exactly 152.4 mm, so this only works
    // once the layout gives up the preferred gutter.
    const layout = layoutPrintSheet(US);
    expect(layout.count).toBe(6);
    expect(layout.columns).toBe(3);
    expect(layout.rows).toBe(2);
    expect(layout.gutterMm).toBe(0);
  });

  it("keeps the comfortable gutter when tightening would not win a copy", () => {
    // 40 x 60 mm fits four either way, so the easier-to-cut spacing survives.
    const layout = layoutPrintSheet(getSpec("saudi-visa")!);
    expect(layout.count).toBe(4);
    expect(layout.gutterMm).toBe(GUTTER_MM);
    expect(layout.marginMm).toBe(MARGIN_MM);
  });

  it("fits more of the smaller 35 x 45 mm photo than the larger 50 x 70 mm one", () => {
    expect(layoutPrintSheet(UK).count).toBeGreaterThan(layoutPrintSheet(CA).count);
  });

  it("keeps every photo inside the paper margins", () => {
    for (const spec of specs) {
      const layout = layoutPrintSheet(spec);
      expect(layout.count).toBeGreaterThan(0);
      const marginPx = (layout.marginMm / 25.4) * SHEET_4X6.dpi;
      for (const cell of sheetCells(layout)) {
        expect(cell.x).toBeGreaterThanOrEqual(marginPx - 1);
        expect(cell.y).toBeGreaterThanOrEqual(marginPx - 1);
        expect(cell.x + layout.photoWidthPx).toBeLessThanOrEqual(
          layout.sheetWidthPx - marginPx + 1,
        );
        expect(cell.y + layout.photoHeightPx).toBeLessThanOrEqual(
          layout.sheetHeightPx - marginPx + 1,
        );
      }
    }
  });

  it("leaves exactly one gutter between neighbouring photos", () => {
    const layout = layoutPrintSheet(UK);
    const cells = sheetCells(layout);
    if (layout.columns > 1) {
      expect(cells[1].x - (cells[0].x + layout.photoWidthPx)).toBeCloseTo(layout.gutterPx, 6);
    }
    if (layout.rows > 1) {
      const nextRow = cells[layout.columns];
      expect(nextRow.y - (cells[0].y + layout.photoHeightPx)).toBeCloseTo(layout.gutterPx, 6);
    }
  });

  it("centres the grid on the sheet", () => {
    const layout = layoutPrintSheet(UK);
    const cells = sheetCells(layout);
    const last = cells[cells.length - 1];
    const rightGap = layout.sheetWidthPx - (last.x + layout.photoWidthPx);
    expect(rightGap).toBeCloseTo(layout.originXPx, 4);
  });

  it("returns one cell per copy", () => {
    const layout = layoutPrintSheet(US);
    expect(sheetCells(layout)).toHaveLength(layout.count);
  });

  it("keeps the photo at its true physical size on the sheet", () => {
    const layout = layoutPrintSheet(US);
    // 2 inches at 300 DPI.
    expect(layout.photoWidthPx).toBeCloseTo(600, 4);
    expect(layout.photoHeightPx).toBeCloseTo(600, 4);
    expect(layout.gutterPx).toBeCloseTo((layout.gutterMm / 25.4) * 300, 6);
  });
});
