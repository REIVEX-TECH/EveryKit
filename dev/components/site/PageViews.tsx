"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { countPageview } from "@/lib/pageview";

/**
 * Counts one view per page, including a route change.
 *
 * It renders nothing and reads nothing. The ref is what keeps a re-render, or
 * React's double-invoked effects in development, from counting the same page
 * twice; it holds a path and is thrown away with the tab.
 */
export function PageViews() {
  const pathname = usePathname();
  const counted = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || counted.current === pathname) return;
    counted.current = pathname;
    countPageview(pathname);
  }, [pathname]);

  return null;
}
