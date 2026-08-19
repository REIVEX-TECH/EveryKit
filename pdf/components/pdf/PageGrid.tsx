"use client";

import { ArrowLeft, ArrowRight, RotateCw, X } from "lucide-react";
import type { Thumbnail } from "@/lib/pdf/thumbnails";

/** One page as the user currently has it arranged. */
export type PageItem = {
  /** Index in the source document. */
  from: number;
  /** Degrees added on top of the rotation the page already carried. */
  rotate: number;
};

type SelectProps = {
  mode: "select";
  thumbnails: Map<number, Thumbnail>;
  pageCount: number;
  selected: number[];
  onSelectedChange: (selected: number[]) => void;
};

type OrganiseProps = {
  mode: "organise";
  thumbnails: Map<number, Thumbnail>;
  pageCount: number;
  items: PageItem[];
  onItemsChange: (items: PageItem[]) => void;
};

type Props = SelectProps | OrganiseProps;

export function PageGrid(props: Props) {
  return (
    <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
      {props.mode === "select"
        ? Array.from({ length: props.pageCount }, (_, index) => (
            <SelectTile key={index} index={index} {...props} />
          ))
        : props.items.map((item, position) => (
            <OrganiseTile
              key={`${item.from}-${position}`}
              item={item}
              position={position}
              {...props}
            />
          ))}
    </ul>
  );
}

/** The page picture, turned to match the rotation currently applied. */
function Preview({
  thumbnail,
  index,
  rotate = 0,
}: {
  thumbnail: Thumbnail | undefined;
  index: number;
  rotate?: number;
}) {
  return (
    <span className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded-[8px] bg-bg-soft">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail.dataUrl}
          alt=""
          className="max-h-full max-w-full object-contain transition-transform"
          style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
        />
      ) : (
        <span className="text-[13px] text-text-light">{index + 1}</span>
      )}
    </span>
  );
}

function SelectTile({
  index,
  thumbnails,
  selected,
  onSelectedChange,
}: SelectProps & { index: number }) {
  const isSelected = selected.includes(index);

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        onClick={() =>
          onSelectedChange(
            isSelected
              ? selected.filter((page) => page !== index)
              : [...selected, index].sort((a, b) => a - b),
          )
        }
        className={[
          "flex w-full flex-col gap-2 rounded-[12px] border p-2 text-left transition-colors",
          isSelected
            ? "border-accent bg-accent/5"
            : "border-line bg-background hover:border-line-strong",
        ].join(" ")}
      >
        <Preview thumbnail={thumbnails.get(index)} index={index} />
        <span className="flex items-center justify-between text-[13px]">
          <span className="tabular-nums text-text-light">Page {index + 1}</span>
          <span className={isSelected ? "font-semibold text-accent-dark" : "text-text-light"}>
            {isSelected ? "Chosen" : "Add"}
          </span>
        </span>
      </button>
    </li>
  );
}

function OrganiseTile({
  item,
  position,
  items,
  thumbnails,
  onItemsChange,
}: OrganiseProps & { item: PageItem; position: number }) {
  function move(by: number) {
    const target = position + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[position], next[target]] = [next[target], next[position]];
    onItemsChange(next);
  }

  function rotate() {
    const next = [...items];
    next[position] = { ...item, rotate: (item.rotate + 90) % 360 };
    onItemsChange(next);
  }

  function remove() {
    onItemsChange(items.filter((_, index) => index !== position));
  }

  const label = `page ${item.from + 1}`;

  return (
    <li className="rounded-[12px] border border-line bg-background p-2">
      <Preview thumbnail={thumbnails.get(item.from)} index={item.from} rotate={item.rotate} />

      <p className="mt-2 flex items-baseline justify-between text-[13px] text-text-light">
        <span className="tabular-nums">Page {item.from + 1}</span>
        {item.rotate ? <span className="tabular-nums">{item.rotate} degrees</span> : null}
      </p>

      <div className="mt-2 grid grid-cols-4 gap-1">
        <IconButton onClick={() => move(-1)} disabled={position === 0} label={`Move ${label} earlier`}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton
          onClick={() => move(1)}
          disabled={position === items.length - 1}
          label={`Move ${label} later`}
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={rotate} label={`Turn ${label} clockwise`}>
          <RotateCw aria-hidden="true" className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={remove} label={`Remove ${label}`}>
          <X aria-hidden="true" className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="ek-btn ek-btn-quiet flex h-9 items-center justify-center p-0 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
