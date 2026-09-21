import { describe, it, expect } from "vitest";
import {
  HISTORY_CAP,
  canRedo,
  canUndo,
  initHistory,
  present,
  push,
  redo,
  replaceTop,
  undo,
} from "./history";
import { createBlock, createColumnChild, withColumnCount, type ColumnsBlock, type NewsletterDoc, type HeadingBlock, type ImageBlock } from "./blocks";

describe("history mechanics", () => {
  it("pushes, undoes and redoes", () => {
    let h = initHistory("a");
    h = push(h, "b");
    h = push(h, "c");
    expect(present(h)).toBe("c");
    expect(canUndo(h)).toBe(true);
    expect(canRedo(h)).toBe(false);

    h = undo(h);
    expect(present(h)).toBe("b");
    h = undo(h);
    expect(present(h)).toBe("a");
    expect(canUndo(h)).toBe(false);

    h = redo(h);
    expect(present(h)).toBe("b");
    expect(canRedo(h)).toBe(true);
  });

  it("does nothing when there is nothing to undo or redo", () => {
    let h = initHistory("only");
    expect(undo(h)).toBe(h);
    expect(redo(h)).toBe(h);
    h = push(h, "next");
    expect(canRedo(undo(h))).toBe(true);
  });

  it("clears the redo tail when a new action happens after undo", () => {
    let h = initHistory("a");
    h = push(h, "b");
    h = push(h, "c");
    h = undo(h); // at "b", redo -> "c" available
    expect(canRedo(h)).toBe(true);
    h = push(h, "d"); // new action
    expect(canRedo(h)).toBe(false);
    expect(present(h)).toBe("d");
    // "c" is gone; undo goes to "b" then "a"
    expect(present(undo(h))).toBe("b");
  });

  it("collapses a burst into one step with replaceTop", () => {
    let h = initHistory("");
    h = push(h, "h"); // first keystroke: a new step
    h = replaceTop(h, "he"); // rest of the burst: replace, no new step
    h = replaceTop(h, "hello");
    expect(present(h)).toBe("hello");
    // one undo reverts the whole burst
    h = undo(h);
    expect(present(h)).toBe("");
    expect(canUndo(h)).toBe(false);
  });

  it("caps depth and drops the oldest steps", () => {
    let h = initHistory(0);
    for (let i = 1; i <= HISTORY_CAP + 20; i++) h = push(h, i);
    expect(h.snapshots.length).toBe(HISTORY_CAP);
    expect(present(h)).toBe(HISTORY_CAP + 20);
    // Undo as far as possible; the floor is the oldest kept step, not 0.
    let steps = 0;
    while (canUndo(h)) {
      h = undo(h);
      steps += 1;
    }
    expect(steps).toBe(HISTORY_CAP - 1);
    expect(present(h)).toBe(21); // 0..20 fell off
  });
});

describe("history round-trips a document with nested column blocks", () => {
  function docWithColumns(): NewsletterDoc {
    const img = { ...(createColumnChild("image") as ImageBlock), imageId: "pic" };
    const head = { ...(createColumnChild("heading") as HeadingBlock), text: "Nested" };
    const two: ColumnsBlock = {
      ...(createBlock("columns") as ColumnsBlock),
      count: 2,
      ratio: [60, 40],
      columns: [
        { background: "#ffffff", padding: 0, block: img },
        { background: "#ffffff", padding: 0, block: head },
      ],
    };
    const three = withColumnCount(createBlock("columns") as ColumnsBlock, 3);
    return {
      name: "Doc",
      pageBackground: "#f4f4f5",
      blocks: [two, three],
      images: [{ id: "pic", name: "hero.png", dataUrl: "data:image/png;base64,AAAA" }],
    };
  }

  it("restores the exact nested structure on undo and redo", () => {
    const original = docWithColumns();
    let h = initHistory(original);

    // A change: rename the second column's heading and flip the ratio.
    const edited: NewsletterDoc = {
      ...original,
      blocks: original.blocks.map((b, i) => {
        if (i !== 0 || b.type !== "columns") return b;
        return {
          ...b,
          ratio: [40, 60],
          columns: b.columns.map((c, ci) =>
            ci === 1 && c.block ? { ...c, block: { ...c.block, text: "Changed" } as HeadingBlock } : c,
          ),
        };
      }),
    };
    h = push(h, edited);
    expect((present(h).blocks[0] as ColumnsBlock).ratio).toEqual([40, 60]);
    expect(((present(h).blocks[0] as ColumnsBlock).columns[1].block as HeadingBlock).text).toBe("Changed");

    h = undo(h);
    const back = present(h);
    expect(back).toBe(original); // same object reference, nothing copied
    expect((back.blocks[0] as ColumnsBlock).ratio).toEqual([60, 40]);
    expect(((back.blocks[0] as ColumnsBlock).columns[1].block as HeadingBlock).text).toBe("Nested");
    expect((back.blocks[1] as ColumnsBlock).count).toBe(3);

    h = redo(h);
    expect(((present(h).blocks[0] as ColumnsBlock).columns[1].block as HeadingBlock).text).toBe("Changed");
  });

  it("shares the images array across snapshots that did not touch it", () => {
    const original = docWithColumns();
    let h = initHistory(original);
    const edited = { ...original, name: "Renamed" };
    h = push(h, edited);
    // The block edit did not clone images, so both steps point at one array.
    expect(present(h).images).toBe(original.images);
    expect(present(undo(h)).images).toBe(original.images);
  });
});
