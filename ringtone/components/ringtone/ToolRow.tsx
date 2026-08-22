import Link from "next/link";

/**
 * The three ringtone tools share a decoder and an MP3 encoder, so a small row
 * moves between them. The home page is the maker; convert and volume sit at
 * their own paths. The way across without the back button, as on the other
 * multi-tool kits.
 */
const TOOLS = [
  { href: "/", label: "Make a ringtone" },
  { href: "/convert", label: "Convert" },
  { href: "/volume", label: "Volume" },
] as const;

export function ToolRow({ current }: { current: "/" | "/convert" | "/volume" }) {
  return (
    <nav aria-label="Ringtone tools" className="border-b border-line">
      <div className="ek-shell flex gap-2 py-2">
        {TOOLS.map((tool) => {
          const active = tool.href === current;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex min-h-[36px] items-center rounded-full border px-4 text-[14px] no-underline transition-colors",
                active
                  ? "border-primary-dark bg-primary-dark text-white"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              {tool.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
