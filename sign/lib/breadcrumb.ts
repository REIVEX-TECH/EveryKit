/**
 * The third breadcrumb segment: which tool this path is, if it is one.
 *
 * The draw tool lives at the kit's home page rather than at its own path, so it
 * is the landing and shows two segments. The other two get three.
 */

import { getTool } from "@/data/tools";

export function currentTool(pathname: string): { name: string; href: string } | null {
  const slug = pathname.replace(/^\/+|\/+$/g, "");
  if (slug === "") return null;

  const tool = getTool(slug);
  return tool ? { name: tool.title, href: `/${tool.slug}` } : null;
}
