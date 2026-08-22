/**
 * The cost of a drive, in whichever units the car and the pump use.
 *
 * The awkward part is not the money, it is that the world measures this three
 * incompatible ways: litres per 100 km, miles per gallon (two of those, US and
 * imperial), and that fuel is priced per litre in most places and per gallon in
 * a few. Getting a wrong answer here is almost always a units mistake, so the
 * conversions are the thing worth isolating and testing.
 *
 * Everything is converted to a common base, litres per kilometre, and the money
 * is done in minor units and rounded once.
 */

import { parseRate } from "./emi";

export type DistanceUnit = "km" | "mi";
export type Efficiency =
  /** Litres per 100 km. */
  | "l100km"
  /** Miles per US gallon. */
  | "mpg-us"
  /** Miles per imperial gallon. */
  | "mpg-uk";
export type FuelPriceUnit = "per-litre" | "per-us-gallon" | "per-uk-gallon";

const KM_PER_MILE = 1.609344;
const LITRES_PER_US_GALLON = 3.785411784;
const LITRES_PER_UK_GALLON = 4.54609;

/** Distance in the given unit, as kilometres. */
export function toKm(distance: number, unit: DistanceUnit): number {
  return unit === "mi" ? distance * KM_PER_MILE : distance;
}

/**
 * An efficiency figure, as litres per kilometre.
 *
 * The two mpg figures invert: more miles per gallon means fewer litres per km,
 * so this is a division, not a multiplication, which is the mistake worth
 * guarding against.
 */
export function toLitresPerKm(value: number, unit: Efficiency): number {
  if (unit === "l100km") return value / 100;
  const litresPerGallon = unit === "mpg-us" ? LITRES_PER_US_GALLON : LITRES_PER_UK_GALLON;
  const kmPerGallon = value * KM_PER_MILE;
  return litresPerGallon / kmPerGallon;
}

/** A fuel price, in minor units per litre, from a price per whatever unit. */
export function toMinorPerLitre(priceMinor: number, unit: FuelPriceUnit): number {
  if (unit === "per-litre") return priceMinor;
  const litres = unit === "per-us-gallon" ? LITRES_PER_US_GALLON : LITRES_PER_UK_GALLON;
  return priceMinor / litres;
}

export type TripInput = {
  distance: number;
  distanceUnit: DistanceUnit;
  efficiency: number;
  efficiencyUnit: Efficiency;
  /** Fuel price in minor units, in its own unit. */
  fuelPriceMinor: number;
  fuelPriceUnit: FuelPriceUnit;
  /** Split between this many people, at least 1. */
  people: number;
};

export type TripResult = {
  litres: number;
  totalMinor: number;
  perPersonMinor: number;
};

/**
 * The fuel used and what it costs, total and per person.
 *
 * Litres is kept as a real number for display, but the cost is computed from
 * the unrounded litres and rounded once at the end, so showing "12.3 litres"
 * and a total to the penny never visibly disagree by a rounding step.
 */
export function tripCost(input: TripInput): TripResult {
  const km = toKm(input.distance, input.distanceUnit);
  const litresPerKm = toLitresPerKm(input.efficiency, input.efficiencyUnit);
  const minorPerLitre = toMinorPerLitre(input.fuelPriceMinor, input.fuelPriceUnit);

  const litres = km * litresPerKm;
  const totalMinor = Math.round(litres * minorPerLitre);
  const people = Math.max(1, Math.floor(input.people));
  const perPersonMinor = Math.round(totalMinor / people);

  return { litres, totalMinor, perPersonMinor };
}

/** A whole count of people, 1 to 99, or null. */
export function parsePeople(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const value = Number(text);
  return value >= 1 && value <= 99 ? value : null;
}

/** A positive measurement (distance or efficiency), or null. Reuses rate parsing shape. */
export function parseMeasure(raw: string): number | null {
  const text = raw.trim().replace(/[,\s_]/g, "");
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export { parseRate };
