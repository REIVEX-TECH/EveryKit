/**
 * The third breadcrumb segment: which letter type this path is, if it is one.
 *
 * Null on the kit's own home page and on privacy and terms.
 */

import { getLetterType } from "@/data/letters";

export function currentTool(pathname: string): { name: string; href: string } | null {
  const match = /^\/letter\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;

  const type = getLetterType(match[1]);
  return type ? { name: type.title, href: `/letter/${type.slug}` } : null;
}
