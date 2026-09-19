"use client";

import {
  Heading, Type, Image as ImageIcon, MousePointerClick, Megaphone,
  Columns2, Minus, MoveVertical, PanelBottom,
} from "lucide-react";
import { PALETTE, type BlockType } from "@/lib/newsletter/blocks";

export const BLOCK_DRAG_TYPE = "application/x-ek-block";

const ICONS: Record<BlockType, typeof Type> = {
  heading: Heading,
  text: Type,
  image: ImageIcon,
  button: MousePointerClick,
  banner: Megaphone,
  columns: Columns2,
  divider: Minus,
  spacer: MoveVertical,
  footer: PanelBottom,
};

/**
 * The block palette. Each item is both draggable onto the canvas and clickable
 * to append, so a mouse-averse person and a drag-happy one both have a path.
 */
export function Palette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div>
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-text-light">Blocks</h2>
      <p className="mt-1 text-[13px] text-text-light">Drag onto the canvas, or click to add.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {PALETTE.map((item) => {
          const Icon = ICONS[item.type];
          return (
            <li key={item.type}>
              <button
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData(BLOCK_DRAG_TYPE, item.type);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onAdd(item.type)}
                title={item.hint}
                className="ek-card flex w-full cursor-grab flex-col items-start gap-1 p-3 text-left hover:border-line-strong active:cursor-grabbing"
              >
                <Icon aria-hidden="true" className="h-4 w-4 text-primary-dark" />
                <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
