/**
 * The third breadcrumb segment: which tool this path is, if it is one.
 *
 * Null on the kit's own home page and on privacy and terms, which are not
 * tools and get two segments rather than three.
 */

import { getTool } from "@/data/tools";

export function currentTool(pathname: string): { name: string; href: string } | null {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (slug === "") return null;

  const tool = getTool(slug);
  return tool ? { name: tool.title, href: `/${tool.slug}` } : null;
}
