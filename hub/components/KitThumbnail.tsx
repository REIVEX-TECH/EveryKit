/**
 * A 1:1 picture of what a kit hands back.
 *
 * These are drawings of the output, not photographs and not screenshots of a
 * customer's result. The Photos thumbnail carries the same measurement overlay
 * the tool itself draws, because that overlay is the thing worth recognising.
 *
 * Inline SVG rather than image files: it keeps the directory to zero image
 * requests, which is most of how this page stays fast.
 */

const HAIR = "#3f3f46";
const SKIN = "#dcc0a6";
const SHIRT = "#94a3b8";
const PHOTO_BG = "#eef2f6";
const GUIDE = "#1d81f2";
const PAPER = "#f8fafc";

type Props = {
  slug: string;
  alt: string;
  muted?: boolean;
};

export function KitThumbnail({ slug, alt, muted = false }: Props) {
  return (
    <div
      className={`aspect-square w-full overflow-hidden rounded-[8px] border border-line ${
        muted ? "opacity-45" : ""
      }`}
    >
      {slug === "photos" ? <PhotoOutput alt={alt} /> : <LetterOutput alt={alt} />}
    </div>
  );
}

/** A finished square passport photo with the head-height guides drawn on. */
function PhotoOutput({ alt }: { alt: string }) {
  const size = 120;
  // The same proportions the tool crops to for a 2 x 2 inch US photo.
  const crown = size * 0.14;
  const chin = size * 0.73;
  const head = chin - crown;
  const headWidth = head * 0.74;
  const cx = size / 2;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={alt} className="h-full w-full">
      <rect width={size} height={size} fill={PHOTO_BG} />

      <path
        d={`M ${cx - headWidth * 1.05} ${size}
            Q ${cx - headWidth * 1.05} ${chin + head * 0.22} ${cx} ${chin + head * 0.22}
            Q ${cx + headWidth * 1.05} ${chin + head * 0.22} ${cx + headWidth * 1.05} ${size} Z`}
        fill={SHIRT}
      />
      <rect
        x={cx - headWidth * 0.17}
        y={chin - head * 0.08}
        width={headWidth * 0.34}
        height={head * 0.4}
        fill={SKIN}
      />
      <ellipse cx={cx} cy={crown + head / 2 - head * 0.04} rx={headWidth / 2 * 1.1} ry={head / 2} fill={HAIR} />
      <ellipse cx={cx} cy={crown + head / 2 + head * 0.05} rx={headWidth / 2} ry={head / 2 * 0.92} fill={SKIN} />

      {/* The signature overlay, at thumbnail scale. */}
      <g stroke={GUIDE} strokeWidth={0.8} shapeRendering="crispEdges">
        <line x1={0} y1={crown} x2={size} y2={crown} />
        <line x1={0} y1={chin} x2={size} y2={chin} />
      </g>
      <g stroke={GUIDE} strokeWidth={0.8} fill="none">
        <line x1={8} y1={crown} x2={8} y2={chin} />
        <line x1={5} y1={crown} x2={11} y2={crown} />
        <line x1={5} y1={chin} x2={11} y2={chin} />
      </g>
    </svg>
  );
}

/** A letter page, for a kit that does not exist yet. Deliberately plain. */
function LetterOutput({ alt }: { alt: string }) {
  const lines = [0.34, 0.42, 0.5, 0.58, 0.66, 0.74];
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={alt} className="h-full w-full">
      <rect width={120} height={120} fill={PAPER} />
      <rect x={22} y={14} width={76} height={92} fill="#ffffff" stroke="#e2e8f0" strokeWidth={1} />
      <rect x={32} y={26} width={30} height={4} fill={SHIRT} />
      <rect x={32} y={34} width={20} height={3} fill="#cbd5e1" />
      {lines.map((t) => (
        <rect key={t} x={32} y={t * 120} width={t > 0.7 ? 30 : 56} height={2.5} fill="#cbd5e1" />
      ))}
    </svg>
  );
}
