"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import {
  EMAIL_WIDTH,
  type Block,
  type BlockType,
  type NewsletterImage,
} from "@/lib/newsletter/blocks";
import { BLOCK_DRAG_TYPE } from "./Palette";
import { IMAGE_DRAG_TYPE } from "./ImageWorkspace";

const MOVE_DRAG_TYPE = "application/x-ek-move";

type Props = {
  blocks: Block[];
  images: NewsletterImage[];
  pageBackground: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCommitText: (id: string, patch: Partial<Block>) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onInsertBlock: (type: BlockType, index: number) => void;
  onInsertImage: (imageId: string, index: number) => void;
  onReorder: (id: string, index: number) => void;
  onPickImage: (id: string) => void;
};

/**
 * The canvas: a fixed 600px email column on the page background, rendered as
 * closely to the exported email as a web view can. It is the drop target for
 * new blocks (from the palette), for images (from the workspace), and for
 * reordering existing blocks by their grip.
 */
export function Canvas(props: Props) {
  const { blocks, pageBackground, selectedId } = props;
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function readDrop(event: React.DragEvent): { kind: "block" | "image" | "move"; value: string } | null {
    const move = event.dataTransfer.getData(MOVE_DRAG_TYPE);
    if (move) return { kind: "move", value: move };
    const image = event.dataTransfer.getData(IMAGE_DRAG_TYPE);
    if (image) return { kind: "image", value: image };
    const block = event.dataTransfer.getData(BLOCK_DRAG_TYPE);
    if (block) return { kind: "block", value: block };
    return null;
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    const payload = readDrop(event);
    const index = dropIndex ?? blocks.length;
    setDropIndex(null);
    if (!payload) return;
    if (payload.kind === "move") props.onReorder(payload.value, index);
    else if (payload.kind === "image") props.onInsertImage(payload.value, index);
    else props.onInsertBlock(payload.value as BlockType, index);
  }

  return (
    <div
      className="min-h-full w-full overflow-auto p-6"
      style={{ background: pageBackground }}
      onClick={() => props.onSelect(null)}
      onDragOver={(event) => {
        // Allow dropping in the gutter below the last block.
        if (readDrop(event)) {
          event.preventDefault();
          if (dropIndex === null) setDropIndex(blocks.length);
        }
      }}
      onDrop={handleDrop}
    >
      <div
        className="mx-auto bg-white"
        style={{ width: EMAIL_WIDTH, maxWidth: "100%" }}
        onClick={(event) => event.stopPropagation()}
      >
        {blocks.length === 0 ? (
          <EmptyState onAdd={(type) => props.onInsertBlock(type, 0)} active={dropIndex !== null} />
        ) : (
          blocks.map((block, index) => (
            <div key={block.id}>
              {dropIndex === index ? <DropLine /> : null}
              <BlockRow
                {...props}
                block={block}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                selected={block.id === selectedId}
                onDragOverRow={(before) => setDropIndex(before ? index : index + 1)}
              />
            </div>
          ))
        )}
        {dropIndex === blocks.length && blocks.length > 0 ? <DropLine /> : null}
      </div>
    </div>
  );
}

function DropLine() {
  return <div className="mx-2 my-0.5 h-0.5 rounded bg-primary" aria-hidden="true" />;
}

function EmptyState({ onAdd, active }: { onAdd: (type: BlockType) => void; active: boolean }) {
  return (
    <div
      className={`m-4 flex flex-col items-center gap-3 rounded-[12px] border-2 border-dashed p-12 text-center ${
        active ? "border-primary bg-bg-soft" : "border-line-strong"
      }`}
    >
      <ImagePlus aria-hidden="true" className="h-7 w-7 text-text-light" />
      <p className="text-[15px] text-text-light">Drag a block here to start your newsletter.</p>
      <button type="button" onClick={() => onAdd("heading")} className="ek-btn ek-btn-accent py-2 text-[14px]">
        Add a heading
      </button>
    </div>
  );
}

function BlockRow({
  block,
  isFirst,
  isLast,
  selected,
  images,
  onSelect,
  onCommitText,
  onMove,
  onDuplicate,
  onRemove,
  onPickImage,
  onDragOverRow,
}: Props & {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  selected: boolean;
  onDragOverRow: (before: boolean) => void;
}) {
  return (
    <div
      role="group"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(block.id);
      }}
      onDragOver={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onDragOverRow(event.clientY < rect.top + rect.height / 2);
      }}
      className={`relative ${selected ? "outline outline-2 outline-primary" : "outline outline-1 outline-transparent hover:outline-line-strong"}`}
    >
      {selected ? (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-full border border-line bg-background px-1 py-0.5 shadow-sm">
          <IconButton label="Drag to reorder" draggable onDragStart={(e) => { e.dataTransfer.setData(MOVE_DRAG_TYPE, block.id); e.dataTransfer.effectAllowed = "move"; }} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Move up" disabled={isFirst} onClick={(e) => { e.stopPropagation(); onMove(block.id, -1); }}>
            <ArrowUp className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Move down" disabled={isLast} onClick={(e) => { e.stopPropagation(); onMove(block.id, 1); }}>
            <ArrowDown className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }}>
            <Copy className="h-3.5 w-3.5" />
          </IconButton>
          <IconButton label="Delete" onClick={(e) => { e.stopPropagation(); onRemove(block.id); }} className="hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      ) : null}

      <BlockBody block={block} images={images} onCommitText={onCommitText} onPickImage={onPickImage} />
    </div>
  );
}

function IconButton({
  children,
  label,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-text-light hover:bg-bg-soft disabled:opacity-30 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

/** The block itself, drawn to look like the email it will export to. */
function BlockBody({
  block,
  images,
  onCommitText,
  onPickImage,
}: {
  block: Block;
  images: NewsletterImage[];
  onCommitText: (id: string, patch: Partial<Block>) => void;
  onPickImage: (id: string) => void;
}) {
  const pad = `${block.padding}px`;

  switch (block.type) {
    case "heading":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, fontWeight: 700, lineHeight: 1.3 }} />
      );
    case "banner":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, fontWeight: 700, lineHeight: 1.3 }} />
      );
    case "text":
    case "footer":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, lineHeight: 1.5 }} />
      );
    case "twoColumn":
      return (
        <div style={{ padding: pad, background: block.background, display: "flex", gap: 16 }}>
          <Editable id={`${block.id}-l`} value={block.left} onCommit={(left) => onCommitText(block.id, { left } as Partial<Block>)}
            style={{ flex: 1, color: block.color, textAlign: block.align, fontSize: block.fontSize, lineHeight: 1.5 }} />
          <Editable id={`${block.id}-r`} value={block.right} onCommit={(right) => onCommitText(block.id, { right } as Partial<Block>)}
            style={{ flex: 1, color: block.color, textAlign: block.align, fontSize: block.fontSize, lineHeight: 1.5 }} />
        </div>
      );
    case "image": {
      const chosen = images.find((image) => image.id === block.imageId) ?? null;
      return (
        <div style={{ padding: pad, background: block.background, textAlign: block.align }}>
          {chosen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chosen.dataUrl} alt={block.alt} style={{ display: "inline-block", width: block.width, maxWidth: "100%", height: "auto" }} />
          ) : (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); onPickImage(block.id); }}
              className="mx-auto flex w-full flex-col items-center gap-2 rounded-[10px] border-2 border-dashed border-line-strong bg-bg-soft py-10 text-text-light hover:border-primary"
            >
              <ImagePlus aria-hidden="true" className="h-6 w-6" />
              <span className="text-[14px]">Choose an image</span>
            </button>
          )}
        </div>
      );
    }
    case "button":
      return (
        <div style={{ padding: pad, background: block.background, textAlign: block.align }}>
          <span style={{ display: "inline-block", padding: "12px 24px", background: block.buttonColor, color: block.buttonTextColor, borderRadius: block.radius, fontSize: 16, fontWeight: 700, lineHeight: 1 }}>
            {block.label}
          </span>
        </div>
      );
    case "divider":
      return (
        <div style={{ padding: pad, background: block.background }}>
          <div style={{ borderTop: `${block.thickness}px solid ${block.lineColor}` }} />
        </div>
      );
    case "spacer":
      return (
        <div style={{ height: block.height, background: block.background }} className="relative">
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] text-text-light">
            {block.height}px space
          </span>
        </div>
      );
  }
}

/**
 * An inline-editable region. Uncontrolled while focused; the key includes the
 * committed value, so an external change remounts it with the new text, while
 * typing (which does not change committed state until blur) leaves it alone and
 * keeps the caret where it is.
 */
function Editable({
  id,
  value,
  onCommit,
  style,
}: {
  id: string;
  value: string;
  onCommit: (text: string) => void;
  style: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      key={`${id}::${value}`}
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Edit text"
      tabIndex={0}
      onClick={(event) => event.stopPropagation()}
      onBlur={() => {
        const text = ref.current?.innerText ?? "";
        if (text !== value) onCommit(text);
      }}
      style={{ outline: "none", whiteSpace: "pre-wrap", cursor: "text", ...style }}
    >
      {value}
    </div>
  );
}
