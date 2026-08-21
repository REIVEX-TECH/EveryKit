/**
 * The third breadcrumb segment: which photo size this path is, if it is one.
 *
 * Photos is a single tool with many size pages, so the third segment names the
 * size rather than a tool. Null on the kit's own home page and on privacy and
 * terms.
 */

import { getSpec, specTitle } from "@/data/specs";

export function currentTool(pathname: string): { name: string; href: string } | null {
  const match = /^\/photo\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;

  const spec = getSpec(match[1]);
  return spec ? { name: specTitle(spec), href: `/photo/${spec.slug}` } : null;
}
