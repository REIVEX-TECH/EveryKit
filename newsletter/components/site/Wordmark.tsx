/**
 * The EveryKit lockup: the four-tile mark beside the wordmark, "Every" in the
 * foreground colour and "Kit" in the primary.
 *
 * Drawn inline rather than loaded from /brand/lockup.svg so it paints with the
 * first HTML response — an <img> in the header would arrive a beat late and
 * shift the row as it landed. The file in public/brand is the same artwork for
 * anyone who needs it outside the app.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        aria-hidden="true"
        // Scales with the surrounding type, so the mark matches whatever the
        // header sets rather than carrying its own fixed size.
        className="h-[1.15em] w-[1.15em] shrink-0"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#1d81f2" />
        <rect x="26" y="2" width="20" height="20" rx="5" fill="#ff8a4c" />
        <rect x="2" y="26" width="20" height="20" rx="5" fill="#1d81f2" />
        <rect x="26" y="26" width="20" height="20" rx="5" fill="#1d81f2" />
      </svg>
      <span className="font-semibold text-foreground">
        Every<span className="text-primary-dark">Kit</span>
      </span>
    </span>
  );
}
