/**
 * The kit's one aesthetic signature: the boundary of the device, drawn.
 *
 * Every competitor in this category uploads your file to a server and words
 * their privacy page carefully. The single idea worth showing here is that the
 * arrow never crosses the outline - so the outline is the picture, and the
 * whole illustration is one flat frame with two pages inside it.
 */
export function OnDeviceDiagram() {
  return (
    <svg
      viewBox="0 0 320 200"
      role="img"
      aria-label="A diagram of one device. Two files and the arrow between them are all inside its outline; nothing crosses it."
      className="h-auto w-full max-w-[320px]"
    >
      <rect
        x="8"
        y="8"
        width="304"
        height="184"
        rx="16"
        fill="var(--color-bg-soft)"
        stroke="var(--color-line-strong)"
        strokeWidth="2"
      />

      <text
        x="24"
        y="34"
        fill="var(--color-text-light)"
        fontSize="12"
        fontFamily="var(--font-plex-sans), sans-serif"
      >
        this device
      </text>

      <g stroke="var(--color-line-strong)" strokeWidth="2" fill="var(--color-background)">
        <rect x="40" y="58" width="72" height="94" rx="6" />
        <rect x="56" y="46" width="72" height="94" rx="6" />
      </g>
      <g stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round">
        <line x1="72" y1="72" x2="112" y2="72" />
        <line x1="72" y1="88" x2="112" y2="88" />
        <line x1="72" y1="104" x2="98" y2="104" />
      </g>

      <g stroke="var(--color-accent)" strokeWidth="3" fill="none" strokeLinecap="round">
        <line x1="148" y1="99" x2="184" y2="99" />
        <polyline points="172,88 184,99 172,110" strokeLinejoin="round" />
      </g>

      <rect
        x="204"
        y="46"
        width="76"
        height="106"
        rx="6"
        fill="var(--color-background)"
        stroke="var(--color-accent)"
        strokeWidth="2"
      />
      <g stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round">
        <line x1="220" y1="72" x2="264" y2="72" />
        <line x1="220" y1="88" x2="264" y2="88" />
        <line x1="220" y1="104" x2="264" y2="104" />
        <line x1="220" y1="120" x2="246" y2="120" />
      </g>
    </svg>
  );
}
