/**
 * "Every" in the foreground colour, "Kit" in the primary. Identical to the
 * wordmark each kit renders in its own header.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold text-foreground ${className}`}>
      Every<span className="text-primary-dark">Kit</span>
    </span>
  );
}
