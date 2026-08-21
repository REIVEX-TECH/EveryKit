/**
 * The third breadcrumb segment: which starting point this path is, if it is one.
 *
 * Null on the kit's own home page and on privacy and terms.
 */

import { getModePage } from "@/data/modes";

export function currentTool(pathname: string): { name: string; href: string } | null {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (slug === "") return null;

  const page = getModePage(slug);
  return page ? { name: page.title, href: `/${page.slug}` } : null;
}
