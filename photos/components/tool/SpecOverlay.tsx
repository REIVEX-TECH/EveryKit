"use client";

import { overlayGuides } from "@/lib/imaging/cropMath";
import { specSizeLabel, type PhotoSpec } from "@/data/specs";

const GUIDE = "#1d81f2";

type Props = {
  spec: PhotoSpec;
  width: number;
  height: number;
};

/**
 * The measurement diagram drawn over the crop window. Thin lines, small labels,
 * the same bands the exported photo is judged against — the point is that you
 * can see the rule you are being held to, not just the result.
 *
 * Positions come from `overlayGuides`, which is the function the compliance
 * checks use, so this can never disagree with the ticks below it.
 */
export function SpecOverlay({ spec, width, height }: Props) {
  const g = overlayGuides(spec);

  const crownTop = g.crownMinFraction * height;
  const crownBottom = g.crownMaxFraction * height;
  const chinTop = g.chinMinFraction * height;
  const chinBottom = g.chinMaxFraction * height;
  const eyeTop = g.eyeMinFraction * height;
  const eyeBottom = g.eyeMaxFraction * height;

  const bracketX = 14;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    >
      {/* Bands where the crown and chin are allowed to fall. */}
      <rect x={0} y={crownTop} width={width} height={crownBottom - crownTop} fill={GUIDE} opacity={0.1} />
      <rect x={0} y={chinTop} width={width} height={chinBottom - chinTop} fill={GUIDE} opacity={0.1} />

      <g stroke={GUIDE} strokeWidth={1} opacity={0.9} shapeRendering="crispEdges">
        <line x1={0} y1={crownTop + 0.5} x2={width} y2={crownTop + 0.5} />
        <line x1={0} y1={crownBottom + 0.5} x2={width} y2={crownBottom + 0.5} />
        <line x1={0} y1={chinTop + 0.5} x2={width} y2={chinTop + 0.5} />
        <line x1={0} y1={chinBottom + 0.5} x2={width} y2={chinBottom + 0.5} />
        <line
          x1={0}
          y1={(eyeTop + eyeBottom) / 2 + 0.5}
          x2={width}
          y2={(eyeTop + eyeBottom) / 2 + 0.5}
          strokeDasharray="4 4"
          opacity={0.8}
        />
      </g>

      {/* Head-height bracket down the left edge. */}
      <g stroke={GUIDE} strokeWidth={1} fill="none" opacity={0.9}>
        <line x1={bracketX + 0.5} y1={crownTop} x2={bracketX + 0.5} y2={chinBottom} />
        <line x1={bracketX - 4} y1={crownTop + 0.5} x2={bracketX + 5} y2={crownTop + 0.5} />
        <line x1={bracketX - 4} y1={chinBottom + 0.5} x2={bracketX + 5} y2={chinBottom + 0.5} />
      </g>

      <Label x={bracketX + 9} y={(crownTop + chinBottom) / 2}>
        {g.isGeneric ? "head" : `${fmt(g.headMinMm)} to ${fmt(g.headMaxMm)} mm`}
      </Label>
      <Label x={width - 8} y={crownTop - 7} anchor="end">
        top of head
      </Label>
      <Label x={width - 8} y={(eyeTop + eyeBottom) / 2 - 6} anchor="end">
        eye line
      </Label>
      <Label x={width - 8} y={chinBottom + 12} anchor="end">
        chin
      </Label>
      <Label x={width / 2} y={height - 8} anchor="middle">
        {specSizeLabel(spec)}
      </Label>

      {/* The frame itself. */}
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        fill="none"
        stroke={GUIDE}
        strokeWidth={1}
      />
    </svg>
  );
}

/**
 * Small type over a photograph needs a halo or it disappears against hair.
 * `paint-order` puts the white stroke behind the fill.
 */
function Label({
  x,
  y,
  anchor = "start",
  children,
}: {
  x: number;
  y: number;
  anchor?: "start" | "middle" | "end";
  children: React.ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={10}
      fill={GUIDE}
      stroke="#ffffff"
      strokeWidth={2.5}
      paintOrder="stroke"
      textAnchor={anchor}
      dominantBaseline="middle"
      fontFamily="inherit"
    >
      {children}
    </text>
  );
}

function fmt(mm: number): string {
  return mm >= 10 ? mm.toFixed(0) : mm.toFixed(1);
}
