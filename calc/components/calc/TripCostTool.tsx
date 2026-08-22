"use client";

import { useMemo, useState } from "react";
import { CURRENCIES, formatMoney, parseAmount } from "@/lib/calc/emi";
import {
  parseMeasure,
  parsePeople,
  tripCost,
  type DistanceUnit,
  type Efficiency,
  type FuelPriceUnit,
} from "@/lib/calc/trip";
import { CopyButton, Field, Input, Note, Select } from "./ui";

/**
 * The cost of a drive, in whichever units the car and the pump use, split per
 * person. The units are the whole problem: distance in km or miles, efficiency
 * as l/100km or mpg in two flavours, fuel priced per litre or per gallon.
 */
export function TripCostTool() {
  const [distance, setDistance] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>("km");
  const [efficiency, setEfficiency] = useState("");
  const [efficiencyUnit, setEfficiencyUnit] = useState<Efficiency>("l100km");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState<FuelPriceUnit>("per-litre");
  const [people, setPeople] = useState("1");
  const [currency, setCurrency] = useState("USD");

  const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? "en-US";
  const money = (minor: number) => formatMoney(minor, currency, locale);

  const d = parseMeasure(distance);
  const e = parseMeasure(efficiency);
  const priceMinor = parseAmount(price);
  const p = parsePeople(people);

  const result = useMemo(() => {
    if (d === null || e === null || priceMinor === null || p === null) return null;
    return tripCost({
      distance: d,
      distanceUnit,
      efficiency: e,
      efficiencyUnit,
      fuelPriceMinor: priceMinor,
      fuelPriceUnit: priceUnit,
      people: p,
    });
  }, [d, distanceUnit, e, efficiencyUnit, priceMinor, priceUnit, p]);

  const sentence = result
    ? `${d} ${distanceUnit} uses about ${result.litres.toFixed(1)} litres, costing ${money(result.totalMinor)}` +
      (p! > 1 ? `, or ${money(result.perPersonMinor)} each for ${p} people.` : ".")
    : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Distance" htmlFor="trip-distance">
          <div className="flex gap-2">
            <Input
              id="trip-distance"
              inputMode="decimal"
              value={distance}
              onChange={(ev) => setDistance(ev.target.value)}
              placeholder="500"
            />
            <Select
              aria-label="Distance unit"
              value={distanceUnit}
              onChange={(ev) => setDistanceUnit(ev.target.value as DistanceUnit)}
              className="w-auto"
            >
              <option value="km">km</option>
              <option value="mi">miles</option>
            </Select>
          </div>
        </Field>

        <Field label="Fuel use" htmlFor="trip-eff">
          <div className="flex gap-2">
            <Input
              id="trip-eff"
              inputMode="decimal"
              value={efficiency}
              onChange={(ev) => setEfficiency(ev.target.value)}
              placeholder="8"
            />
            <Select
              aria-label="Efficiency unit"
              value={efficiencyUnit}
              onChange={(ev) => setEfficiencyUnit(ev.target.value as Efficiency)}
              className="w-auto"
            >
              <option value="l100km">L/100km</option>
              <option value="mpg-us">mpg (US)</option>
              <option value="mpg-uk">mpg (UK)</option>
            </Select>
          </div>
        </Field>

        <Field label="Fuel price" htmlFor="trip-price">
          <div className="flex gap-2">
            <Input
              id="trip-price"
              inputMode="decimal"
              value={price}
              onChange={(ev) => setPrice(ev.target.value)}
              placeholder="1.50"
            />
            <Select
              aria-label="Fuel price unit"
              value={priceUnit}
              onChange={(ev) => setPriceUnit(ev.target.value as FuelPriceUnit)}
              className="w-auto"
            >
              <option value="per-litre">per litre</option>
              <option value="per-us-gallon">per US gal</option>
              <option value="per-uk-gallon">per UK gal</option>
            </Select>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Currency" htmlFor="trip-currency">
            <Select
              id="trip-currency"
              value={currency}
              onChange={(ev) => setCurrency(ev.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="People" htmlFor="trip-people" note="Split the cost.">
            <Input
              id="trip-people"
              inputMode="numeric"
              value={people}
              onChange={(ev) => setPeople(ev.target.value)}
              placeholder="1"
            />
          </Field>
        </div>
      </div>

      {result ? (
        <section className="ek-card p-5">
          <p className="text-[14px] text-text-light">Fuel for the trip</p>
          <p className="text-[34px] leading-tight tabular-nums">{money(result.totalMinor)}</p>
          <p className="mt-2 text-[15px]">
            About {result.litres.toFixed(1)} litres.
            {p! > 1 ? (
              <>
                {" "}
                <span className="font-semibold">{money(result.perPersonMinor)}</span> each, split
                between {p}.
              </>
            ) : null}
          </p>
          <div className="mt-4">
            <CopyButton text={sentence} className="ek-btn ek-btn-quiet px-4 py-2 text-[14px]" />
          </div>
        </section>
      ) : (
        <Note tone="quiet">Fill in the distance, fuel use and price for an answer.</Note>
      )}
    </div>
  );
}
