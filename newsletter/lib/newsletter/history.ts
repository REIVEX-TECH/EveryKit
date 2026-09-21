/**
 * A tiny undo/redo history over immutable snapshots.
 *
 * The logic is pure and framework-free so it can be unit tested on its own; the
 * builder wraps it in a hook that adds debounced coalescing and keyboard
 * shortcuts. A snapshot is whatever it is given, here a whole newsletter
 * document. Because the builder updates documents immutably and leaves the
 * `images` array untouched on a block edit, snapshots that did not change the
 * images share that one array by reference rather than copying every data URL,
 * so depth stays cheap even with pictures in the document.
 */

/** How many steps are kept. Older steps fall off the bottom. */
export const HISTORY_CAP = 50;

export type History<T> = {
  /** Oldest to newest. `snapshots[index]` is the current state. */
  snapshots: T[];
  index: number;
};

export function initHistory<T>(present: T): History<T> {
  return { snapshots: [present], index: 0 };
}

export function present<T>(history: History<T>): T {
  return history.snapshots[history.index];
}

export function canUndo<T>(history: History<T>): boolean {
  return history.index > 0;
}

export function canRedo<T>(history: History<T>): boolean {
  return history.index < history.snapshots.length - 1;
}

/**
 * Add a new step. Anything ahead of the current position (the redo tail) is
 * dropped, which is the standard "a new action clears redo" behaviour, and the
 * oldest steps are trimmed once the cap is passed.
 */
export function push<T>(history: History<T>, next: T, cap: number = HISTORY_CAP): History<T> {
  const kept = history.snapshots.slice(0, history.index + 1);
  kept.push(next);
  const overflow = kept.length - cap;
  const trimmed = overflow > 0 ? kept.slice(overflow) : kept;
  return { snapshots: trimmed, index: trimmed.length - 1 };
}

/**
 * Replace the current step in place, without adding one. This is how a burst of
 * rapid edits (typing, dragging a slider) collapses into a single undo step:
 * the first edit pushes, the rest replace.
 */
export function replaceTop<T>(history: History<T>, next: T): History<T> {
  const snapshots = history.snapshots.slice();
  snapshots[history.index] = next;
  return { snapshots, index: history.index };
}

export function undo<T>(history: History<T>): History<T> {
  return canUndo(history) ? { ...history, index: history.index - 1 } : history;
}

export function redo<T>(history: History<T>): History<T> {
  return canRedo(history) ? { ...history, index: history.index + 1 } : history;
}
