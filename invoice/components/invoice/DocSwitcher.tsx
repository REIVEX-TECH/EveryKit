import Link from "next/link";

/**
 * Invoice, quote and receipt are one engine wearing three sets of words, so a
 * small row moves between them. The home page is the invoice, and the two
 * variants sit at their own paths; this is the way across without the back
 * button, the same idea as the tool switcher on the multi-tool kits.
 */
const DOCS = [
  { href: "/", label: "Invoice" },
  { href: "/quote", label: "Quote" },
  { href: "/receipt", label: "Receipt" },
] as const;

export function DocSwitcher({ current }: { current: "/" | "/quote" | "/receipt" }) {
  return (
    <nav aria-label="Document type" className="border-b border-line">
      <div className="ek-shell flex gap-2 py-2">
        {DOCS.map((doc) => {
          const active = doc.href === current;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              aria-current={active ? "page" : undefined}
              className={[
                "inline-flex min-h-[36px] items-center rounded-full border px-4 text-[14px] no-underline transition-colors",
                active
                  ? "border-primary-dark bg-primary-dark text-white"
                  : "border-line text-text-light hover:border-line-strong hover:text-foreground",
              ].join(" ")}
            >
              {doc.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
