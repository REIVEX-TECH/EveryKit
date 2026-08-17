import { overlayGuides } from "@/lib/imaging/cropMath";
import { specSizeLabel, type PhotoSpec } from "@/data/specs";

/**
 * The one aesthetic signature in this product: a loose selfie next to the
 * cropped result, with the spec drawn over it the way a government guidance
 * sheet would draw it.
 *
 * The guide lines come from the same `overlayGuides` the crop tool uses, so
 * this diagram cannot drift away from what the tool actually does.
 *
 * The figure is a drawing, not a photograph, and is labelled as one. Putting a
 * stock face here would be pretending to show a customer's result.
 */

const PANEL_HEIGHT = 188;

const HAIR = "#3f3f46";
const SKIN = "#dcc0a6";
const SHIRT = "#94a3b8";
const PHOTO_BG = "#eef2f6";
const LINE = "#94a3b8";
const GUIDE = "#1d81f2";

type Props = {
  spec: PhotoSpec;
};

export function ExamplePair({ spec }: Props) {
  const guides = overlayGuides(spec);

  const outWidth = PANEL_HEIGHT * (spec.widthMm / spec.heightMm);
  const crown = ((guides.crownMinFraction + guides.crownMaxFraction) / 2) * PANEL_HEIGHT;
  const chin = ((guides.chinMinFraction + guides.chinMaxFraction) / 2) * PANEL_HEIGHT;
  const eye = ((guides.eyeMinFraction + guides.eyeMaxFraction) / 2) * PANEL_HEIGHT;

  // The selfie panel is deliberately loose: a smaller head, off to one side,
  // which is what a photo taken at arm's length actually looks like.
  const inWidth = PANEL_HEIGHT * 0.78;

  return (
    <figure className="m-0">
      <div className="flex items-center justify-center gap-5 sm:gap-7">
        <div>
          <svg
            viewBox={`0 0 ${inWidth} ${PANEL_HEIGHT}`}
            width={inWidth}
            height={PANEL_HEIGHT}
            role="img"
            aria-label="A drawing of a loosely framed selfie, with the head small and off centre."
            className="block rounded-[4px]"
          >
            <rect width={inWidth} height={PANEL_HEIGHT} fill={PHOTO_BG} />
            <Figure
              centerX={inWidth * 0.56}
              crownY={PANEL_HEIGHT * 0.28}
              chinY={PANEL_HEIGHT * 0.62}
              bottomY={PANEL_HEIGHT}
            />
            <rect
              x={0.5}
              y={0.5}
              width={inWidth - 1}
              height={PANEL_HEIGHT - 1}
              fill="none"
              stroke={LINE}
              strokeWidth={1}
            />
          </svg>
          <p className="mt-2 text-center text-[12px] text-text-light">Your selfie</p>
        </div>

        <svg
          width="20"
          height="12"
          viewBox="0 0 20 12"
          aria-hidden="true"
          className="shrink-0 text-line-strong"
        >
          <path
            d="M0 6h17M13 2l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div>
          <svg
            viewBox={`0 0 ${outWidth} ${PANEL_HEIGHT}`}
            width={outWidth}
            height={PANEL_HEIGHT}
            role="img"
            aria-label={`A drawing of the same face cropped to ${specSizeLabel(spec)}, with guide lines marking the crown, eye line and chin.`}
            className="block rounded-[4px]"
          >
            <rect width={outWidth} height={PANEL_HEIGHT} fill={PHOTO_BG} />
            <Figure
              centerX={outWidth / 2}
              crownY={crown}
              chinY={chin}
              bottomY={PANEL_HEIGHT}
            />

            {/* The spec, drawn the way a guidance sheet draws it. */}
            <g stroke={GUIDE} strokeWidth={1} shapeRendering="crispEdges">
              <line x1={0} y1={crown + 0.5} x2={outWidth} y2={crown + 0.5} />
              <line x1={0} y1={chin + 0.5} x2={outWidth} y2={chin + 0.5} />
              <line
                x1={0}
                y1={eye + 0.5}
                x2={outWidth}
                y2={eye + 0.5}
                strokeDasharray="3 3"
                opacity={0.75}
              />
            </g>

            {/* Head-height bracket. */}
            <g stroke={GUIDE} strokeWidth={1} fill="none">
              <line x1={10.5} y1={crown} x2={10.5} y2={chin} />
              <line x1={7} y1={crown + 0.5} x2={14} y2={crown + 0.5} />
              <line x1={7} y1={chin + 0.5} x2={14} y2={chin + 0.5} />
            </g>
            <text
              x={17}
              y={(crown + chin) / 2}
              fill={GUIDE}
              fontSize={8}
              dominantBaseline="middle"
              fontFamily="inherit"
            >
              {guides.isGeneric
                ? "head"
                : `${round(guides.headMinMm)}–${round(guides.headMaxMm)} mm`}
            </text>

            <rect
              x={0.5}
              y={0.5}
              width={outWidth - 1}
              height={PANEL_HEIGHT - 1}
              fill="none"
              stroke={GUIDE}
              strokeWidth={1}
            />
          </svg>
          <p className="mt-2 text-center text-[12px] text-text-light">{specSizeLabel(spec)}</p>
        </div>
      </div>
      <figcaption className="mt-4 text-center text-[12px] text-text-light">
        Illustration, not a customer photo. The guide lines are the real
        measurements this tool crops to.
      </figcaption>
    </figure>
  );
}

/** A flat figure: hair, face, neck, shoulders. No shading, no gradient. */
function Figure({
  centerX,
  crownY,
  chinY,
  bottomY,
}: {
  centerX: number;
  crownY: number;
  chinY: number;
  bottomY: number;
}) {
  const headHeight = chinY - crownY;
  const headWidth = headHeight * 0.74;
  const faceRx = headWidth / 2;
  const faceRy = headHeight / 2;
  const faceCy = crownY + faceRy;

  const shoulderTop = chinY + headHeight * 0.28;
  const shoulderWidth = headWidth * 2.1;

  return (
    <g>
      {/* Shoulders, drawn first so the neck sits on top. */}
      <path
        d={`M ${centerX - shoulderWidth / 2} ${bottomY}
            Q ${centerX - shoulderWidth / 2} ${shoulderTop} ${centerX} ${shoulderTop}
            Q ${centerX + shoulderWidth / 2} ${shoulderTop} ${centerX + shoulderWidth / 2} ${bottomY} Z`}
        fill={SHIRT}
      />
      <rect
        x={centerX - headWidth * 0.17}
        y={chinY - headHeight * 0.08}
        width={headWidth * 0.34}
        height={shoulderTop - chinY + headHeight * 0.12}
        fill={SKIN}
      />
      {/* Hair behind the face. */}
      <ellipse cx={centerX} cy={faceCy - headHeight * 0.04} rx={faceRx * 1.1} ry={faceRy * 1.02} fill={HAIR} />
      <ellipse cx={centerX} cy={faceCy + headHeight * 0.05} rx={faceRx} ry={faceRy * 0.92} fill={SKIN} />
    </g>
  );
}

function round(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(0);
}
