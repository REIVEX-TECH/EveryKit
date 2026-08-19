/**
 * The crop stage's geometry, as pure functions.
 *
 * This used to live inline in the component, which meant the one thing worth
 * proving about it could not be tested: that the region of the photo the stage
 * shows inside its guides is exactly the region the renderer exports. When
 * those two drift apart the tool lies to the user, and it lies convincingly,
 * because each half is internally consistent.
 *
 * Everything here is in one of two spaces and says which:
 *   source space  pixels of the full-resolution photo. The crop rect lives here.
 *   screen space  CSS pixels inside the stage element.
 */

import type { CropRect, ImageSize } from "./cropMath";

export type StageLayout = {
  /** The crop window, in screen pixels. */
  windowWidth: number;
  windowHeight: number;
  /** Screen pixels per source pixel. */
  k: number;
  /** Top-left of the crop window within the stage, in screen pixels. */
  windowLeft: number;
  windowTop: number;
  /** The photo drawn at full extent, in screen pixels. */
  displayWidth: number;
  displayHeight: number;
  /** Where the photo's top-left sits, relative to the stage. */
  originX: number;
  originY: number;
};

export function stageLayout(
  rect: CropRect,
  source: ImageSize,
  aspect: number,
  stageWidth: number,
  stageHeight: number,
  windowFill: number,
): StageLayout {
  let windowHeight = stageHeight * windowFill;
  let windowWidth = windowHeight * aspect;
  const maxWidth = stageWidth * windowFill;
  if (windowWidth > maxWidth) {
    windowWidth = maxWidth;
    windowHeight = windowWidth / aspect;
  }

  const k = rect.width > 0 ? windowWidth / rect.width : 0;
  const windowLeft = (stageWidth - windowWidth) / 2;
  const windowTop = (stageHeight - windowHeight) / 2;

  return {
    windowWidth,
    windowHeight,
    k,
    windowLeft,
    windowTop,
    displayWidth: source.width * k,
    displayHeight: source.height * k,
    originX: windowLeft - rect.x * k,
    originY: windowTop - rect.y * k,
  };
}

/**
 * The region of the photo, in source pixels, that the crop window actually
 * shows. Derived from the rendered layout rather than from the rect, so it
 * catches the case where the transform and the rect disagree.
 *
 * This is the number that has to match what the renderer exports. If the stage
 * draws the photo at the wrong scale or offset, this comes out different from
 * the rect even though the rect itself is fine.
 */
export function visibleRegion(layout: StageLayout): CropRect {
  if (layout.k === 0) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: (layout.windowLeft - layout.originX) / layout.k,
    y: (layout.windowTop - layout.originY) / layout.k,
    width: layout.windowWidth / layout.k,
    height: layout.windowHeight / layout.k,
  };
}

/**
 * Where the photo's own edges land inside the crop window, in screen pixels.
 *
 * Used to tell the difference between "the guides are over blank space because
 * the crop really is off the subject" and "the crop is fine but the photo is
 * being drawn somewhere else". Negative left/top means the photo starts outside
 * the window, which is normal for a crop taken from the middle of a photo.
 */
export function photoEdgesInWindow(layout: StageLayout) {
  return {
    left: layout.originX - layout.windowLeft,
    top: layout.originY - layout.windowTop,
    right: layout.originX + layout.displayWidth - layout.windowLeft,
    bottom: layout.originY + layout.displayHeight - layout.windowTop,
  };
}

/** True when the crop window is filled by photo, with no blank edge showing. */
export function windowFullyCovered(layout: StageLayout): boolean {
  const e = photoEdgesInWindow(layout);
  const slack = 0.5;
  return (
    e.left <= slack &&
    e.top <= slack &&
    e.right >= layout.windowWidth - slack &&
    e.bottom >= layout.windowHeight - slack
  );
}
