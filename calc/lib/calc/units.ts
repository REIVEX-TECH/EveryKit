/**
 * Unit conversion for length, weight, temperature and area.
 *
 * Everything except temperature is a ratio, so each unit records how many of a
 * base unit it is and a conversion is one multiply and one divide. Temperature
 * is not a ratio, because its scales have different zeros: 20 degrees Celsius
 * is not twice 10, and treating it as a ratio is the single most common bug in
 * a converter. It gets its own path.
 *
 * The factors below are the exact definitions, not approximations. An inch is
 * exactly 25.4 mm and a pound is exactly 0.45359237 kg by international
 * agreement, so those digits are not a rounding of a measurement.
 */

export type Category = "length" | "weight" | "temperature" | "area";

export type Unit = {
  id: string;
  name: string;
  /** Short label for the result line. */
  symbol: string;
  /** How many base units one of these is. Absent for temperature. */
  factor?: number;
};

export const CATEGORIES: Record<Category, { label: string; base: string; units: Unit[] }> = {
  length: {
    label: "Length",
    base: "metre",
    units: [
      { id: "mm", name: "Millimetres", symbol: "mm", factor: 0.001 },
      { id: "cm", name: "Centimetres", symbol: "cm", factor: 0.01 },
      { id: "m", name: "Metres", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometres", symbol: "km", factor: 1000 },
      { id: "in", name: "Inches", symbol: "in", factor: 0.0254 },
      { id: "ft", name: "Feet", symbol: "ft", factor: 0.3048 },
      { id: "yd", name: "Yards", symbol: "yd", factor: 0.9144 },
      { id: "mi", name: "Miles", symbol: "mi", factor: 1609.344 },
      { id: "nmi", name: "Nautical miles", symbol: "nmi", factor: 1852 },
    ],
  },
  weight: {
    label: "Weight",
    base: "kilogram",
    units: [
      { id: "mg", name: "Milligrams", symbol: "mg", factor: 0.000001 },
      { id: "g", name: "Grams", symbol: "g", factor: 0.001 },
      { id: "kg", name: "Kilograms", symbol: "kg", factor: 1 },
      { id: "t", name: "Tonnes", symbol: "t", factor: 1000 },
      { id: "oz", name: "Ounces", symbol: "oz", factor: 0.028349523125 },
      { id: "lb", name: "Pounds", symbol: "lb", factor: 0.45359237 },
      { id: "st", name: "Stone", symbol: "st", factor: 6.35029318 },
    ],
  },
  temperature: {
    label: "Temperature",
    base: "celsius",
    units: [
      { id: "c", name: "Celsius", symbol: "°C" },
      { id: "f", name: "Fahrenheit", symbol: "°F" },
      { id: "k", name: "Kelvin", symbol: "K" },
    ],
  },
  area: {
    label: "Area",
    base: "square metre",
    units: [
      { id: "sqcm", name: "Square centimetres", symbol: "cm²", factor: 0.0001 },
      { id: "sqm", name: "Square metres", symbol: "m²", factor: 1 },
      { id: "sqkm", name: "Square kilometres", symbol: "km²", factor: 1_000_000 },
      { id: "sqft", name: "Square feet", symbol: "ft²", factor: 0.09290304 },
      { id: "sqyd", name: "Square yards", symbol: "yd²", factor: 0.83612736 },
      { id: "acre", name: "Acres", symbol: "ac", factor: 4046.8564224 },
      { id: "ha", name: "Hectares", symbol: "ha", factor: 10_000 },
      { id: "marla", name: "Marla", symbol: "marla", factor: 25.2929 },
      { id: "kanal", name: "Kanal", symbol: "kanal", factor: 505.857 },
    ],
  },
};

/** The default pair for each category: the conversion people actually arrive for. */
export const DEFAULT_PAIR: Record<Category, [string, string]> = {
  length: ["cm", "in"],
  weight: ["kg", "lb"],
  temperature: ["c", "f"],
  area: ["sqm", "sqft"],
};

export function unitsFor(category: Category): Unit[] {
  return CATEGORIES[category].units;
}

export function findUnit(category: Category, id: string): Unit | undefined {
  return CATEGORIES[category].units.find((unit) => unit.id === id);
}

/** Temperature to Celsius, and back out again. Not a ratio, so not a factor. */
function toCelsius(value: number, from: string): number {
  if (from === "c") return value;
  if (from === "f") return (value - 32) * (5 / 9);
  return value - 273.15;
}

function fromCelsius(celsius: number, to: string): number {
  if (to === "c") return celsius;
  if (to === "f") return celsius * (9 / 5) + 32;
  return celsius + 273.15;
}

export function convert(value: number, category: Category, from: string, to: string): number | null {
  if (!Number.isFinite(value)) return null;
  const source = findUnit(category, from);
  const target = findUnit(category, to);
  if (!source || !target) return null;

  if (category === "temperature") return fromCelsius(toCelsius(value, from), to);
  if (source.factor === undefined || target.factor === undefined) return null;
  return (value * source.factor) / target.factor;
}

/**
 * The answer, at a precision that does not lie.
 *
 * Capped at six significant figures, and trailing zeroes dropped. A converter
 * that prints 2.5400000000000005 inches has told the truth about floating point
 * and nothing useful about the measurement.
 */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return "";
  if (value === 0) return "0";

  const magnitude = Math.abs(value);
  // Very large and very small numbers go to exponent form rather than filling
  // the box with zeroes.
  if (magnitude >= 1e12 || magnitude < 1e-6) return value.toExponential(4);

  const rounded = Number(value.toPrecision(6));
  return String(rounded);
}

/** A typed number, or null. Commas and spaces are stripped, since people paste them. */
export function parseValue(raw: string): number | null {
  const text = raw.trim().replace(/[,\s_]/g, "");
  if (text === "" || text === "-") return null;
  if (!/^-?\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}
