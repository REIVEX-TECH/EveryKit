/**
 * The third breadcrumb segment: which tool this path is, if it is one.
 *
 * This kit is a single tool, the builder, which lives at the home path. There
 * are no sub-tool pages, so the breadcrumb is always the two segments EveryKit
 * and Newsletter, and this returns null everywhere.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function currentTool(pathname: string): { name: string; href: string } | null {
  return null;
}
