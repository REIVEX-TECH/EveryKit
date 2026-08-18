"use client";

import { useEffect, useState } from "react";
import { fetchKits, type Kit } from "@/lib/kits";
import { KIT_SLUG } from "@/lib/site";

/**
 * Shown once someone has their file. If the registry cannot be read the strip
 * renders nothing at all — no spinner, no error, no empty heading.
 */
export function MoreFromEveryKit() {
  const [kits, setKits] = useState<Kit[]>([]);

  useEffect(() => {
    let active = true;
    fetchKits().then((all) => {
      if (active) setKits(all.filter((kit) => kit.slug !== KIT_SLUG));
    });
    return () => {
      active = false;
    };
  }, []);

  if (kits.length === 0) return null;

  return (
    <section className="mt-8 border-t border-line pt-6">
      <h3 className="text-[15px] font-semibold text-foreground">More from EveryKit</h3>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {kits.map((kit) => (
          <li key={kit.slug}>
            {kit.status === "live" ? (
              <a
                href={kit.url}
                className="ek-card block p-4 no-underline transition-colors hover:border-primary"
              >
                <p className="text-[15px] font-semibold text-foreground">{kit.name}</p>
                <p className="mt-1 text-[14px] text-text-light">{kit.tagline}</p>
              </a>
            ) : (
              <div className="ek-card block bg-bg-soft p-4">
                <p className="text-[15px] font-semibold text-text-light">
                  {kit.name}{" "}
                  <span className="font-normal text-text-light">— coming soon</span>
                </p>
                <p className="mt-1 text-[14px] text-text-light">{kit.tagline}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
