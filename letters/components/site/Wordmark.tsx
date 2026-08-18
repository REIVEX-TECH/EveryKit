/**
 * The EveryKit wordmark: "Every" in the foreground colour, "Kit" in the primary.
 * Shared across kits, so it lives on its own rather than inline in the header.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold text-foreground ${className}`}>
      Every<span className="text-primary-dark">Kit</span>
    </span>
  );
}
