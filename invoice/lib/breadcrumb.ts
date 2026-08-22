/**
 * The third breadcrumb segment.
 *
 * The home page is the invoice tool itself and stays at two segments. The two
 * variants that live at their own paths, the quote and the receipt, get a third
 * segment naming them, resolved from the path so the shared header does not need
 * to know which kits have variants.
 */

export function currentTool(pathname: string): { name: string; href: string } | null {
  if (pathname.startsWith("/quote")) return { name: "Quote", href: "/quote" };
  if (pathname.startsWith("/receipt")) return { name: "Receipt", href: "/receipt" };
  return null;
}
