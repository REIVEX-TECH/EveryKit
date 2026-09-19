"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, GripVertical, ImagePlus, Trash2 } from "lucide-react";
import {
  COLUMN_CHILD_TYPES,
  EMAIL_WIDTH,
  blockLabel,
  type Block,
  type BlockType,
  type ColumnsBlock,
  type NewsletterImage,
} from "@/lib/newsletter/blocks";
import { BLOCK_DRAG_TYPE } from "./Palette";
import { IMAGE_DRAG_TYPE } from "./ImageWorkspace";

const MOVE_DRAG_TYPE = "application/x-ek-move";
const DRAG_TYPES = [MOVE_DRAG_TYPE, IMAGE_DRAG_TYPE, BLOCK_DRAG_TYPE];

/**
 * Whether this drag carries one of our payloads. Checked against
 * `dataTransfer.types`, which is the ONLY thing readable during dragover:
 * getData returns an empty string until the drop event for security reasons, so
 * gating preventDefault on getData meant preventDefault never ran, the browser
 * refused the drop, and nothing was ever inserted.
 */
function hasDropData(event: React.DragEvent): boolean {
  return DRAG_TYPES.some((type) => event.dataTransfer.types.includes(type));
}

type DropPayload =
  | { kind: "block"; type: BlockType }
  | { kind: "image"; imageId: string }
  | { kind: "move"; id: string };

/** Read the payload from a drop event (getData is readable now, unlike dragover). */
function readDrop(event: React.DragEvent): DropPayload | null {
  const move = event.dataTransfer.getData(MOVE_DRAG_TYPE);
  if (move) return { kind: "move", id: move };
  const image = event.dataTransfer.getData(IMAGE_DRAG_TYPE);
  if (image) return { kind: "image", imageId: image };
  const block = event.dataTransfer.getData(BLOCK_DRAG_TYPE);
  if (block) return { kind: "block", type: block as BlockType };
  return null;
}

/** What a column cell accepts on drop, and how the builder is asked to apply it. */
export type ColumnDrop = { kind: "block"; type: BlockType } | { kind: "image"; imageId: string };

/** The shared handlers the block bodies need, bundled so nesting stays tidy. */
type Ctx = {
  images: NewsletterImage[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCommitText: (id: string, patch: Partial<Block>) => void;
  onPickImage: (id: string) => void;
  onDropIntoColumn: (columnsId: string, index: number, drop: ColumnDrop) => void;
};

type Props = Ctx & {
  blocks: Block[];
  pageBackground: string;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onInsertBlock: (type: BlockType, index: number) => void;
  onInsertImage: (imageId: string, index: number) => void;
  onReorder: (id: string, index: number) => void;
};

/**
 * The canvas: the email column on the page background, rendered as closely to
 * the exported email as a web view can. It is the drop target for new blocks
 * (from the palette), for images (from the workspace), and for reordering
 * existing blocks by their grip. Columns rows have their own per-column drop
 * targets, handled in ColumnsBody.
 */
export function Canvas(props: Props) {
  const { blocks, pageBackground, selectedId } = props;
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const ctx: Ctx = {
    images: props.images,
    selectedId: props.selectedId,
    onSelect: props.onSelect,
    onCommitText: props.onCommitText,
    onPickImage: props.onPickImage,
    onDropIntoColumn: props.onDropIntoColumn,
  };

  function handleDrop(event: React.DragEvent) {
    if (!hasDropData(event)) return;
    event.preventDefault();
    const payload = readDrop(event);
    const index = dropIndex ?? blocks.length;
    setDropIndex(null);
    setDragActive(false);
    if (!payload) return;
    if (payload.kind === "move") props.onReorder(payload.id, index);
    else if (payload.kind === "image") props.onInsertImage(payload.imageId, index);
    else props.onInsertBlock(payload.type, index);
  }

  return (
    <div
      className="min-h-full w-full overflow-auto p-6 transition-colors"
      style={{ background: pageBackground }}
      onClick={() => props.onSelect(null)}
      onDragOver={(event) => {
        if (!hasDropData(event)) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = event.dataTransfer.types.includes(MOVE_DRAG_TYPE) ? "move" : "copy";
        setDragActive(true);
        setDropIndex((current) => (current === null ? blocks.length : current));
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragActive(false);
          setDropIndex(null);
        }
      }}
      onDrop={handleDrop}
    >
      <div
        className={`mx-auto bg-white transition-shadow ${dragActive ? "outline outline-2 outline-primary" : ""}`}
        style={{ width: EMAIL_WIDTH, maxWidth: "100%" }}
        onClick={(event) => event.stopPropagation()}
      >
        {blocks.length === 0 ? (
          <EmptyState onAdd={(type) => props.onInsertBlock(type, 0)} active={dragActive} />
        ) : (
          blocks.map((block, index) => (
            <div key={block.id}>
              {dropIndex === index ? <DropLine /> : null}
              <BlockRow
                block={block}
                ctx={ctx}
                isFirst={index === 0}
                isLast={index === blocks.length - 1}
                selected={block.id === selectedId}
                onMove={props.onMove}
                onDuplicate={props.onDuplicate}
                onRemove={props.onRemove}
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
  return (
    <div className="relative mx-1 my-1 h-[3px] rounded-full bg-primary" aria-hidden="true">
      <span className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-primary" />
    </div>
  );
}

function EmptyState({ onAdd, active }: { onAdd: (type: BlockType) => void; active: boolean }) {
  return (
    <div
      className={`m-4 flex flex-col items-center gap-3 rounded-[12px] border-2 border-dashed p-12 text-center transition-colors ${
        active ? "border-primary bg-primary/5" : "border-line-strong"
      }`}
    >
      <ImagePlus aria-hidden="true" className="h-7 w-7 text-text-light" />
      <p className="text-[15px] text-text-light">
        {active ? "Drop it here" : "Drag a block here to start your newsletter."}
      </p>
      <button type="button" onClick={() => onAdd("heading")} className="ek-btn ek-btn-accent py-2 text-[14px]">
        Add a heading
      </button>
    </div>
  );
}

function BlockRow({
  block,
  ctx,
  isFirst,
  isLast,
  selected,
  onMove,
  onDuplicate,
  onRemove,
  onDragOverRow,
}: {
  block: Block;
  ctx: Ctx;
  isFirst: boolean;
  isLast: boolean;
  selected: boolean;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onDragOverRow: (before: boolean) => void;
}) {
  return (
    <div
      role="group"
      onClick={(event) => {
        event.stopPropagation();
        ctx.onSelect(block.id);
      }}
      onDragOver={(event) => {
        if (!hasDropData(event)) return;
        event.preventDefault();
        event.stopPropagation();
        const rect = event.currentTarget.getBoundingClientRect();
        onDragOverRow(event.clientY < rect.top + rect.height / 2);
      }}
      className={`group relative transition-[outline-color] ${
        selected ? "outline outline-2 outline-primary" : "outline outline-1 outline-transparent hover:outline-line-strong"
      }`}
    >
      <span
        className={`pointer-events-none absolute -top-2.5 left-2 z-10 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white transition-opacity ${
          selected ? "opacity-0" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        {blockLabel(block.type)}
      </span>

      {selected ? (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded-full border border-line bg-background px-1 py-0.5 shadow-sm">
          <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-text-light">
            {blockLabel(block.type)}
          </span>
          <IconButton
            label="Drag to reorder"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(MOVE_DRAG_TYPE, block.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            className="cursor-grab active:cursor-grabbing"
          >
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

      <BlockBody block={block} ctx={ctx} />
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
function BlockBody({ block, ctx }: { block: Block; ctx: Ctx }) {
  const pad = `${block.padding}px`;

  switch (block.type) {
    case "heading":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => ctx.onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, fontWeight: 700, lineHeight: 1.3 }} />
      );
    case "banner":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => ctx.onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, fontWeight: 700, lineHeight: 1.3 }} />
      );
    case "text":
    case "footer":
      return (
        <Editable id={block.id} value={block.text} onCommit={(text) => ctx.onCommitText(block.id, { text } as Partial<Block>)}
          style={{ padding: pad, background: block.background, color: block.color, textAlign: block.align, fontSize: block.fontSize, lineHeight: 1.5 }} />
      );
    case "columns":
      return <ColumnsBody block={block} ctx={ctx} />;
    case "image": {
      const chosen = ctx.images.find((image) => image.id === block.imageId) ?? null;
      return (
        <div style={{ padding: pad, background: block.background, textAlign: block.align }}>
          {chosen ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={chosen.dataUrl} alt={block.alt} style={{ display: "inline-block", width: block.width, maxWidth: "100%", height: "auto" }} />
          ) : (
            <button
              type="button"
              onClick={(event) => { event.stopPropagation(); ctx.onPickImage(block.id); }}
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
 * A columns row on the canvas. Each column is a drop target for an allowed block
 * type or an image, and shows its nested block (which stays clickable to edit)
 * or an empty drop hint. Flexbox is fine here because this is the web builder;
 * the EXPORT uses tables only.
 */
function ColumnsBody({ block, ctx }: { block: ColumnsBlock; ctx: Ctx }) {
  const cells = block.columns.slice(0, block.count);
  return (
    <div style={{ display: "flex", padding: `${block.padding}px`, background: block.background }}>
      {cells.map((cell, index) => (
        <ColumnCellView
          key={index}
          columnsId={block.id}
          index={index}
          widthPct={block.ratio[index] ?? Math.round(100 / block.count)}
          cell={cell}
          ctx={ctx}
        />
      ))}
    </div>
  );
}

function ColumnCellView({
  columnsId,
  index,
  widthPct,
  cell,
  ctx,
}: {
  columnsId: string;
  index: number;
  widthPct: number;
  cell: ColumnsBlock["columns"][number];
  ctx: Ctx;
}) {
  const [over, setOver] = useState(false);
  const nested = cell.block;
  const nestedSelected = nested !== null && ctx.selectedId === nested.id;

  return (
    <div
      style={{ width: `${widthPct}%`, boxSizing: "border-box", padding: "0 4px" }}
      onDragOver={(event) => {
        if (!hasDropData(event)) return;
        // Own this drop so the canvas row does not also try to insert a block.
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!hasDropData(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        const payload = readDrop(event);
        if (!payload) return;
        if (payload.kind === "block" && (COLUMN_CHILD_TYPES as string[]).includes(payload.type)) {
          ctx.onDropIntoColumn(columnsId, index, { kind: "block", type: payload.type });
        } else if (payload.kind === "image") {
          ctx.onDropIntoColumn(columnsId, index, { kind: "image", imageId: payload.imageId });
        }
        // A move, or a type a column may not hold (banner, divider, footer,
        // columns), is ignored rather than dropped somewhere wrong.
      }}
    >
      <div
        onClick={(event) => {
          event.stopPropagation();
          ctx.onSelect(nested ? nested.id : columnsId);
        }}
        style={{ background: cell.background, padding: `${cell.padding}px`, minHeight: 48 }}
        className={`h-full rounded-[8px] transition-colors ${
          over ? "outline outline-2 outline-primary" : nestedSelected ? "outline outline-2 outline-primary" : "outline outline-1 outline-dashed outline-line-strong"
        }`}
      >
        {nested ? (
          <BlockBody block={nested} ctx={ctx} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-1 py-6 text-center text-text-light">
            <ImagePlus aria-hidden="true" className="h-5 w-5" />
            <span className="text-[12px]">Drop a block, or pick a type in the panel</span>
          </div>
        )}
      </div>
    </div>
  );
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
