/**
 * The newsletter model.
 *
 * A newsletter is an ordered list of blocks plus a small set of images held in
 * memory. Every block is a plain, serialisable object so the whole document can
 * live in React state, be written to localStorage as a local draft, and be fed
 * straight to the exporter with no other state involved.
 *
 * The email width is fixed at 600px on purpose and is not a block or document
 * field: 600 is the width every email client and template has agreed on for two
 * decades, and letting someone pick 640 is how a layout that looked right in the
 * builder arrives clipped in Outlook.
 */

export const EMAIL_WIDTH = 600;

export type Align = "left" | "center" | "right";

export type BlockType =
  | "heading"
  | "text"
  | "image"
  | "button"
  | "banner"
  | "columns"
  | "divider"
  | "spacer"
  | "footer";

/**
 * The block types a column cell may hold. One level only: a column cannot hold
 * another columns block, a banner, a divider or a footer, which keeps the model
 * flat enough to render and reason about.
 */
export type ColumnChildType = "heading" | "text" | "image" | "button" | "spacer";

export const COLUMN_CHILD_TYPES: ColumnChildType[] = [
  "heading",
  "text",
  "image",
  "button",
  "spacer",
];

/** An image the person added, held in the tab as a data URL until export. */
export type NewsletterImage = {
  id: string;
  /** The original file name, used as the basis for the exported file name. */
  name: string;
  /** data:image/...;base64,... . Never uploaded; written into the zip on export. */
  dataUrl: string;
};

type Common = {
  id: string;
  /** The block's own background colour. The page background sits behind it. */
  background: string;
  /** One padding value, applied on every side, in px. */
  padding: number;
};

type TextLike = {
  color: string;
  align: Align;
  fontSize: number;
};

export type HeadingBlock = Common & TextLike & { type: "heading"; text: string };
export type TextBlock = Common & TextLike & { type: "text"; text: string };
export type BannerBlock = Common & TextLike & { type: "banner"; text: string };
export type FooterBlock = Common & TextLike & { type: "footer"; text: string };

/**
 * One cell of a columns row. It carries its own background and padding, and one
 * nested block of an allowed child type (or none yet). The nested block is a
 * full Block so it reuses every existing per-block editor and email renderer;
 * there is one source of truth for how a heading or an image is drawn.
 */
export type ColumnCell = {
  background: string;
  padding: number;
  block: ColumnChild | null;
};

/** A block permitted inside a column. */
export type ColumnChild = HeadingBlock | TextBlock | ImageBlock | ButtonBlock | SpacerBlock;

export type ColumnsBlock = Common & {
  type: "columns";
  count: 2 | 3;
  /** Width percentages, one per column, summing to 100. length === count. */
  ratio: number[];
  columns: ColumnCell[];
};

export type ImageBlock = Common & {
  type: "image";
  imageId: string | null;
  alt: string;
  href: string;
  width: number;
  align: Align;
};

export type ButtonBlock = Common & {
  type: "button";
  label: string;
  href: string;
  buttonColor: string;
  buttonTextColor: string;
  radius: number;
  align: Align;
};

export type DividerBlock = Common & { type: "divider"; thickness: number; lineColor: string };
export type SpacerBlock = Common & { type: "spacer"; height: number };

export type Block =
  | HeadingBlock
  | TextBlock
  | BannerBlock
  | FooterBlock
  | ColumnsBlock
  | ImageBlock
  | ButtonBlock
  | DividerBlock
  | SpacerBlock;

export type NewsletterDoc = {
  name: string;
  pageBackground: string;
  blocks: Block[];
  images: NewsletterImage[];
};

/** The palette, in the order it is shown. Label and a one-line description. */
export const PALETTE: Array<{ type: BlockType; label: string; hint: string }> = [
  { type: "heading", label: "Heading", hint: "A short, bold line" },
  { type: "text", label: "Text", hint: "A paragraph of copy" },
  { type: "image", label: "Image", hint: "A picture from your workspace" },
  { type: "button", label: "Button", hint: "A link that looks like a button" },
  { type: "banner", label: "Banner", hint: "A full width coloured strip" },
  { type: "columns", label: "Columns", hint: "Two or three columns, each holding a block" },
  { type: "divider", label: "Divider", hint: "A thin horizontal line" },
  { type: "spacer", label: "Spacer", hint: "Empty vertical space" },
  { type: "footer", label: "Footer", hint: "Small print and an unsubscribe line" },
];

const PALETTE_LABELS: Record<BlockType, string> = Object.fromEntries(
  PALETTE.map((item) => [item.type, item.label]),
) as Record<BlockType, string>;

export function blockLabel(type: BlockType): string {
  return PALETTE_LABELS[type];
}

/** A stable id. crypto.randomUUID is in every browser and in Node 20. */
export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `b_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

const INK = "#171717";
const BODY = "#444444";
const WHITE = "#ffffff";
const PRIMARY = "#1d81f2";
const LINE = "#e2e8f0";
const MUTED = "#8a8a8a";

/** A fresh block of the given type, with sensible, editable defaults. */
export function createBlock(type: BlockType): Block {
  const id = newId();
  switch (type) {
    case "heading":
      return { id, type, text: "Your headline goes here", color: INK, background: WHITE, align: "left", fontSize: 26, padding: 24 };
    case "text":
      return {
        id,
        type,
        text: "Write something for your readers here. Click to edit this text.",
        color: BODY,
        background: WHITE,
        align: "left",
        fontSize: 16,
        padding: 24,
      };
    case "banner":
      return { id, type, text: "Big announcement", color: WHITE, background: PRIMARY, align: "center", fontSize: 22, padding: 32 };
    case "footer":
      return {
        id,
        type,
        text: "You are receiving this because you signed up.\nUnsubscribe | 123 Example Street, Your City",
        color: MUTED,
        background: WHITE,
        align: "center",
        fontSize: 12,
        padding: 24,
      };
    case "columns":
      return {
        id,
        type,
        background: WHITE,
        padding: 0,
        count: 2,
        ratio: [50, 50],
        columns: [emptyCell(), emptyCell()],
      };
    case "image":
      return { id, type, imageId: null, alt: "", href: "", width: EMAIL_WIDTH, background: WHITE, align: "center", padding: 0 };
    case "button":
      return {
        id,
        type,
        label: "Read more",
        href: "https://",
        buttonColor: PRIMARY,
        buttonTextColor: WHITE,
        radius: 6,
        background: WHITE,
        align: "center",
        padding: 24,
      };
    case "divider":
      return { id, type, thickness: 1, lineColor: LINE, background: WHITE, padding: 12 };
    case "spacer":
      return { id, type, height: 24, background: WHITE, padding: 0 };
  }
}

/** A fresh, empty column cell. */
export function emptyCell(): ColumnCell {
  return { background: WHITE, padding: 0, block: null };
}

/** A fresh nested block for a column. Reuses createBlock's defaults. */
export function createColumnChild(type: ColumnChildType): ColumnChild {
  return createBlock(type) as ColumnChild;
}

/**
 * The split-ratio presets offered per column count. Percentages, summing to 100.
 * The first entry in each list is the default for that count.
 */
export const RATIO_PRESETS: Record<2 | 3, number[][]> = {
  2: [
    [50, 50],
    [60, 40],
    [40, 60],
    [33, 67],
    [67, 33],
  ],
  3: [
    [33, 34, 33],
    [50, 25, 25],
    [25, 50, 25],
    [25, 25, 50],
  ],
};

/**
 * Change a columns block's count, preserving the cells that still fit and the
 * blocks inside them, and resetting the ratio to that count's default.
 */
export function withColumnCount(block: ColumnsBlock, count: 2 | 3): ColumnsBlock {
  const columns = [...block.columns];
  while (columns.length < count) columns.push(emptyCell());
  columns.length = count;
  return { ...block, count, columns, ratio: [...RATIO_PRESETS[count][0]] };
}

/** A brand-new, empty newsletter. */
export function createDoc(): NewsletterDoc {
  return { name: "My newsletter", pageBackground: "#f4f4f5", blocks: [], images: [] };
}
