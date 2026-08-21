/**
 * The third breadcrumb segment, which this kit never has.
 *
 * One tool, one page. The breadcrumb stays at two segments everywhere, and this
 * exists so the shared header does not need to know which kits are which.
 */

// The path is taken and ignored, so the shared header can call every kit's
// resolver the same way without knowing which kits have a third segment.
export function currentTool(pathname: string): { name: string; href: string } | null {
  void pathname;
  return null;
}
