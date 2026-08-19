/**
 * Bringing a finished result into view.
 *
 * The problem this solves: the moment someone's photo is ready is the moment
 * that matters, and until now it rendered below the fold on a phone. They had
 * to scroll to find out whether the thing they came for had worked.
 *
 * On a wide screen the result column is sticky and this never fires. On a
 * narrow one it scrolls the result into view — but only when it genuinely is
 * out of view, and never in the two cases where moving the page under someone
 * is hostile:
 *
 *  - while they are typing, because the caret would run away from them;
 *  - on first paint, because nothing has happened yet to be worth showing.
 *
 * Scrolling is never disabled, hijacked or locked. This nudges the viewport
 * once, when there is something new to see, and otherwise leaves it alone.
 */

/** True when the element is already substantially on screen. */
function alreadyVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const viewport = window.innerHeight || document.documentElement.clientHeight;
  if (rect.height === 0) return false;

  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewport);
  const visible = Math.max(0, visibleBottom - visibleTop);

  // Half of it, or a screenful, whichever is the smaller ask — a result taller
  // than the viewport can never be "fully" visible.
  const enough = Math.min(rect.height * 0.5, viewport * 0.6);
  return visible >= enough;
}

/**
 * Input types where a caret is in play and moving the page would yank it away.
 *
 * Deliberately not every input. Choosing a file, ticking a box or dragging a
 * slider leaves focus on that control, and treating those as "typing" meant the
 * reveal never fired on the one path that matters — focus sits on the hidden
 * file input straight after a photo is picked.
 */
const TEXT_ENTRY_TYPES = new Set([
  "text", "search", "email", "url", "tel", "password", "number",
  "date", "datetime-local", "month", "week", "time",
]);

/** Typing, or filling a field. Moving the page now would be rude. */
function userIsEditing(): boolean {
  const active = document.activeElement as HTMLElement | null;
  if (!active) return false;
  if (active.isContentEditable) return true;
  if (active.tagName === "TEXTAREA") return true;
  if (active.tagName === "INPUT") {
    const type = (active as HTMLInputElement).type?.toLowerCase() ?? "text";
    return TEXT_ENTRY_TYPES.has(type);
  }
  return false;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Scroll `element` into view if it is off screen and the moment is right.
 * Returns whether it actually scrolled, which the tests assert on.
 */
export function revealResult(element: HTMLElement | null): boolean {
  if (typeof window === "undefined" || !element) return false;
  if (userIsEditing()) return false;
  if (alreadyVisible(element)) return false;

  element.scrollIntoView({
    // An instant jump for anyone who has asked for less motion. The rule is
    // about vestibular comfort, not about whether the scroll happens.
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "nearest",
  });
  return true;
}
