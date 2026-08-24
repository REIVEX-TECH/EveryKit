import { describe, expect, it } from "vitest";
import jsQR from "jsqr";
import { judgeContrast } from "./contrast";
import { PALETTES } from "./palettes";
import {
  toMatrix,
  toRgba,
  type FinderStyle,
  type ModuleShape,
  type Style,
} from "./render";

const SHAPES: ModuleShape[] = ["square", "rounded", "dots"];
const FINDERS: FinderStyle[] = ["square", "rounded"];

function scanStyled(payload: string, style: Style, colours = PALETTES[0].colours): string | null {
  const matrix = toMatrix(payload, "M");
  const { data, width, height } = toRgba(matrix, 10, colours, style);
  return jsQR(data, width, height)?.data ?? null;
}

describe("every styled QR still decodes", () => {
  const payload = "https://useeverykit.com/qr-style-test";
  for (const moduleShape of SHAPES) {
    for (const finderStyle of FINDERS) {
      it(`${moduleShape} modules with ${finderStyle} finders`, () => {
        expect(scanStyled(payload, { moduleShape, finderStyle })).toBe(payload);
      });
    }
  }
});

describe("every styled QR decodes in every preset palette", () => {
  for (const palette of PALETTES) {
    it(`${palette.name}, rounded modules and finders`, () => {
      const decoded = scanStyled(
        "https://useeverykit.com/palette",
        { moduleShape: "rounded", finderStyle: "rounded" },
        palette.colours,
      );
      expect(decoded).toBe("https://useeverykit.com/palette");
    });
  }
});

describe("every preset palette passes the contrast check", () => {
  for (const palette of PALETTES) {
    it(`${palette.name} is judged ok`, () => {
      const verdict = judgeContrast(palette.colours.dark, palette.colours.light);
      expect(verdict.level).toBe("ok");
    });
  }
});

describe("square-on-white is unchanged by the style default", () => {
  it("the default style still decodes", () => {
    expect(scanStyled("PLAIN", { moduleShape: "square", finderStyle: "square" })).toBe("PLAIN");
  });
});
