/**
 * The third breadcrumb segment.
 *
 * The home page is the ringtone maker itself and stays at two segments. The two
 * tools that live at their own paths, convert and volume, get a third segment
 * naming them, resolved from the path so the shared header does not need to know
 * which kits have extra tools.
 */

export function currentTool(pathname: string): { name: string; href: string } | null {
  if (pathname.startsWith("/convert")) return { name: "Convert", href: "/convert" };
  if (pathname.startsWith("/volume")) return { name: "Volume", href: "/volume" };
  return null;
}
