"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Eye, FolderOpen, Monitor, Pencil, Redo2, RotateCcw, Smartphone, Undo2, X } from "lucide-react";
import { EmailGate } from "@/components/site/EmailGate";
import { hasGivenEmail } from "@/lib/emailCapture";
import { countToolCompleted, countToolOpened } from "@/lib/pageview";
import {
  createBlock,
  createColumnChild,
  createDoc,
  newId,
  withColumnCount,
  type Block,
  type BlockType,
  type ColumnCell,
  type ColumnChild,
  type ColumnsBlock,
  type ImageBlock,
  type NewsletterDoc,
  type NewsletterImage,
} from "@/lib/newsletter/blocks";
import { buildExport, importFromHtml, importFromZipBytes, renderEmailHtml } from "@/lib/newsletter/export";
import {
  canRedo as histCanRedo,
  canUndo as histCanUndo,
  initHistory,
  present,
  push,
  redo as histRedo,
  replaceTop,
  undo as histUndo,
  type History,
} from "@/lib/newsletter/history";
import { clearDraft, loadDraft, saveDraft } from "@/lib/newsletter/draft";
import { Palette } from "./Palette";
import { Canvas, type ColumnDrop } from "./Canvas";

/** Find a block by id, searching top-level blocks and nested column cells. */
function findBlock(blocks: Block[], id: string | null): Block | null {
  if (!id) return null;
  for (const block of blocks) {
    if (block.id === id) return block;
    if (block.type === "columns") {
      for (const cell of block.columns) {
        if (cell.block && cell.block.id === id) return cell.block;
      }
    }
  }
  return null;
}

/** Apply a transform to the block with this id, wherever it lives (nested too). */
function applyToBlock(blocks: Block[], id: string, transform: (b: Block) => Block): Block[] {
  return blocks.map((block) => {
    if (block.id === id) return transform(block);
    if (block.type === "columns") {
      let changed = false;
      const columns = block.columns.map((cell) => {
        if (cell.block && cell.block.id === id) {
          changed = true;
          return { ...cell, block: transform(cell.block) as ColumnChild };
        }
        return cell;
      });
      return changed ? { ...block, columns } : block;
    }
    return block;
  });
}

/** Operate on one columns block by id. */
function mapColumns(blocks: Block[], columnsId: string, fn: (b: ColumnsBlock) => ColumnsBlock): Block[] {
  return blocks.map((block) => (block.type === "columns" && block.id === columnsId ? fn(block) : block));
}

/** Set one cell's fields on a columns block. */
function setCell(col: ColumnsBlock, index: number, patch: Partial<ColumnCell>): ColumnsBlock {
  return { ...col, columns: col.columns.map((cell, i) => (i === index ? { ...cell, ...patch } : cell)) };
}

/** Clear any image block (top-level or nested) that referenced a removed image. */
function clearImageRefs(blocks: Block[], imageId: string): Block[] {
  return blocks.map((block) => {
    if (block.type === "image" && block.imageId === imageId) return { ...block, imageId: null };
    if (block.type === "columns") {
      return {
        ...block,
        columns: block.columns.map((cell) =>
          cell.block && cell.block.type === "image" && cell.block.imageId === imageId
            ? { ...cell, block: { ...cell.block, imageId: null } }
            : cell,
        ),
      };
    }
    return block;
  });
}

/** A deep copy with fresh ids, including nested column blocks, for duplicate. */
function cloneBlock(block: Block): Block {
  if (block.type === "columns") {
    return {
      ...block,
      id: newId(),
      columns: block.columns.map((cell) => ({
        ...cell,
        block: cell.block ? ({ ...cell.block, id: newId() } as ColumnChild) : null,
      })),
    };
  }
  return { ...block, id: newId() };
}
import { Inspector } from "./Inspector";
import { ImageWorkspace } from "./ImageWorkspace";

/** How long a burst of rapid edits stays a single undo step. */
const COALESCE_MS = 500;

/**
 * Document state with undo/redo.
 *
 * `commit` records a discrete step (add, delete, move, drop, and so on).
 * `coalesce` records rapid edits under a key so a burst (typing in a field,
 * dragging a slider) collapses into one step: the first edit pushes, and later
 * edits with the same key within the window replace the top instead. Any
 * structural action or an undo/redo ends the current burst. `reset` throws the
 * whole history away, used when a different newsletter is loaded.
 */
function useDocHistory(initial: NewsletterDoc) {
  const [history, setHistory] = useState<History<NewsletterDoc>>(() => initHistory(initial));
  const coalesceRef = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  const endCoalesce = useCallback(() => {
    if (coalesceRef.current) {
      clearTimeout(coalesceRef.current.timer);
      coalesceRef.current = null;
    }
  }, []);

  const commit = useCallback(
    (updater: (d: NewsletterDoc) => NewsletterDoc) => {
      endCoalesce();
      setHistory((h) => push(h, updater(present(h))));
    },
    [endCoalesce],
  );

  const coalesce = useCallback(
    (updater: (d: NewsletterDoc) => NewsletterDoc, key: string) => {
      const active = coalesceRef.current;
      const same = active !== null && active.key === key;
      if (active) clearTimeout(active.timer);
      coalesceRef.current = { key, timer: setTimeout(() => { coalesceRef.current = null; }, COALESCE_MS) };
      setHistory((h) => (same ? replaceTop(h, updater(present(h))) : push(h, updater(present(h)))));
    },
    [],
  );

  const undo = useCallback(() => { endCoalesce(); setHistory((h) => histUndo(h)); }, [endCoalesce]);
  const redo = useCallback(() => { endCoalesce(); setHistory((h) => histRedo(h)); }, [endCoalesce]);
  const reset = useCallback((next: NewsletterDoc) => { endCoalesce(); setHistory(initHistory(next)); }, [endCoalesce]);

  return {
    doc: present(history),
    commit,
    coalesce,
    undo,
    redo,
    reset,
    canUndo: histCanUndo(history),
    canRedo: histCanRedo(history),
  };
}

/**
 * The builder. All of the document state lives here and flows down; the panels
 * are presentational. The email gate and the two funnel events are wired once,
 * the same way the instrumented kits do it: tool-opened when this mounts, and
 * tool-completed when an export or an HTML copy actually happens.
 */
export function Builder() {
  const { doc, commit, coalesce, undo, redo, reset, canUndo, canRedo } = useDocHistory(createDoc());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [pickingFor, setPickingFor] = useState<string | null>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const openInputRef = useRef<HTMLInputElement>(null);

  // Restore a local draft on mount, and count the tool as opened once.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) reset(draft);
    setLoaded(true);
    // Only count an open where the builder is actually usable. On a phone the
    // page shows the "larger screen" notice instead, and counting an open there
    // would put an unreachable step into the funnel.
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      countToolOpened();
    }
  }, [reset]);

  // Persist the draft, debounced, once the initial load has run so an empty
  // first render never overwrites a saved draft.
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => saveDraft(doc), 500);
    return () => clearTimeout(timer);
  }, [doc, loaded]);

  // Keyboard undo/redo, but only when focus is not in a text field, where the
  // browser's own text undo must win. Range and colour inputs are not text
  // fields, so a slider or swatch still undoes at the document level.
  useEffect(() => {
    const isTextField = (target: EventTarget | null): boolean => {
      const node = target as HTMLElement | null;
      if (!node || !node.tagName) return false;
      if (node.tagName === "TEXTAREA") return true;
      if (node.tagName === "INPUT") {
        const type = (node as HTMLInputElement).type;
        return !["checkbox", "radio", "range", "color", "button", "submit", "reset", "file"].includes(type);
      }
      return node.isContentEditable === true;
    };
    const onKey = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const key = event.key.toLowerCase();
      const wantsUndo = key === "z" && !event.shiftKey && !event.altKey;
      const wantsRedo = (key === "z" && event.shiftKey) || key === "y";
      if (!wantsUndo && !wantsRedo) return;
      if (isTextField(document.activeElement) || isTextField(event.target)) return;
      event.preventDefault();
      if (wantsUndo) undo();
      else redo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const selected = findBlock(doc.blocks, selectedId);

  // --- document updates ---------------------------------------------------

  const insertAt = useCallback((block: Block, index: number) => {
    commit((d) => {
      const blocks = [...d.blocks];
      blocks.splice(Math.max(0, Math.min(index, blocks.length)), 0, block);
      return { ...d, blocks };
    });
    setSelectedId(block.id);
  }, [commit]);

  const insertBlock = useCallback((type: BlockType, index: number) => insertAt(createBlock(type), index), [insertAt]);

  const insertImage = useCallback(
    (imageId: string, index: number) => insertAt({ ...(createBlock("image") as Extract<Block, { type: "image" }>), imageId }, index),
    [insertAt],
  );

  // Rapid property edits (typing, sliders, colour) coalesce per block into one
  // undo step; a different block or a pause starts a new step.
  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    coalesce((d) => ({
      ...d,
      blocks: applyToBlock(d.blocks, id, (block) => ({ ...block, ...patch }) as Block),
    }), `prop:${id}`);
  }, [coalesce]);

  // A discrete block change (choosing or clearing an image) that is its own step.
  const commitBlock = useCallback((id: string, patch: Partial<Block>) => {
    commit((d) => ({
      ...d,
      blocks: applyToBlock(d.blocks, id, (block) => ({ ...block, ...patch }) as Block),
    }));
  }, [commit]);

  // --- column operations --------------------------------------------------

  const onDropIntoColumn = useCallback((columnsId: string, index: number, drop: ColumnDrop) => {
    const child: ColumnChild =
      drop.kind === "image"
        ? { ...(createColumnChild("image") as ImageBlock), imageId: drop.imageId }
        : createColumnChild(drop.type as Parameters<typeof createColumnChild>[0]);
    commit((d) => ({ ...d, blocks: mapColumns(d.blocks, columnsId, (col) => setCell(col, index, { block: child })) }));
    setSelectedId(child.id);
  }, [commit]);

  const setColumnCount = useCallback((columnsId: string, count: 2 | 3) => {
    commit((d) => ({ ...d, blocks: mapColumns(d.blocks, columnsId, (col) => withColumnCount(col, count)) }));
  }, [commit]);

  const setColumnRatio = useCallback((columnsId: string, ratio: number[]) => {
    commit((d) => ({ ...d, blocks: mapColumns(d.blocks, columnsId, (col) => ({ ...col, ratio: [...ratio] })) }));
  }, [commit]);

  const setColumnCellProp = useCallback((columnsId: string, index: number, patch: Partial<ColumnCell>) => {
    coalesce((d) => ({ ...d, blocks: mapColumns(d.blocks, columnsId, (col) => setCell(col, index, patch)) }), `col:${columnsId}:${index}`);
  }, [coalesce]);

  const setColumnType = useCallback((columnsId: string, index: number, type: ColumnChild["type"] | "") => {
    const child = type === "" ? null : createColumnChild(type);
    commit((d) => ({ ...d, blocks: mapColumns(d.blocks, columnsId, (col) => setCell(col, index, { block: child })) }));
    if (child) setSelectedId(child.id);
  }, [commit]);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    commit((d) => {
      const index = d.blocks.findIndex((block) => block.id === id);
      const target = index + dir;
      if (index < 0 || target < 0 || target >= d.blocks.length) return d;
      const blocks = [...d.blocks];
      [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
      return { ...d, blocks };
    });
  }, [commit]);

  const reorder = useCallback((id: string, toIndex: number) => {
    commit((d) => {
      const from = d.blocks.findIndex((block) => block.id === id);
      if (from < 0) return d;
      const blocks = [...d.blocks];
      const [moved] = blocks.splice(from, 1);
      const adjusted = from < toIndex ? toIndex - 1 : toIndex;
      blocks.splice(Math.max(0, Math.min(adjusted, blocks.length)), 0, moved);
      return { ...d, blocks };
    });
  }, [commit]);

  const duplicateBlock = useCallback((id: string) => {
    commit((d) => {
      const index = d.blocks.findIndex((block) => block.id === id);
      if (index < 0) return d;
      const copy = cloneBlock(d.blocks[index]);
      const blocks = [...d.blocks];
      blocks.splice(index + 1, 0, copy);
      return { ...d, blocks };
    });
  }, [commit]);

  const removeBlock = useCallback((id: string) => {
    commit((d) => ({ ...d, blocks: d.blocks.filter((block) => block.id !== id) }));
    setSelectedId((current) => (current === id ? null : current));
  }, [commit]);

  // --- images -------------------------------------------------------------

  const addImages = useCallback((files: FileList | File[]) => {
    const list = Array.from(files).filter((file) => file.type.startsWith("image/"));
    Promise.all(
      list.map(
        (file) =>
          new Promise<NewsletterImage | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ id: newId(), name: file.name, dataUrl: String(reader.result) });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    ).then((results) => {
      const added = results.filter((image): image is NewsletterImage => image !== null);
      if (added.length > 0) commit((d) => ({ ...d, images: [...d.images, ...added] }));
    });
  }, [commit]);

  const removeImage = useCallback((id: string) => {
    commit((d) => ({
      ...d,
      images: d.images.filter((image) => image.id !== id),
      blocks: clearImageRefs(d.blocks, id),
    }));
  }, [commit]);

  const startOver = useCallback(() => {
    if (!window.confirm("Start a new newsletter? This clears the current one from this browser.")) return;
    clearDraft();
    reset(createDoc());
    setSelectedId(null);
    setView("edit");
  }, [reset]);

  const openFile = useCallback(async (file: File) => {
    const isZip = /\.zip$/i.test(file.name) || file.type === "application/zip";
    let next: NewsletterDoc | null = null;
    try {
      if (isZip) {
        next = importFromZipBytes(new Uint8Array(await file.arrayBuffer()));
      } else {
        next = importFromHtml(await file.text());
      }
    } catch {
      next = null;
    }
    if (!next) {
      window.alert("That file was not made by this tool, so it could not be opened. Choose the ZIP you exported here.");
      return;
    }
    reset(next);
    setSelectedId(null);
    setView("edit");
  }, [reset]);

  // --- the gate + funnel --------------------------------------------------

  const take = useCallback((action: () => void) => {
    if (hasGivenEmail()) {
      action();
      countToolCompleted();
      return;
    }
    setPending(() => action);
  }, []);

  const hasContent = doc.blocks.length > 0;

  const download = useCallback(() => {
    const result = buildExport(doc);
    const blob = new Blob([result.zip as BlobPart], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = result.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [doc]);

  const copyHtml = useCallback(() => {
    const { html } = buildExport(doc);
    void navigator.clipboard.writeText(html).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [doc]);

  // --- preview ------------------------------------------------------------

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (view !== "preview") return;
    const map = new Map(doc.images.map((image) => [image.id, image.dataUrl]));
    const html = renderEmailHtml(doc, map);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [view, doc]);

  const pickImages = useMemo(() => doc.images, [doc.images]);

  return (
    <div className="ek-shell py-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col">
          <span className="text-[12px] font-semibold text-text-light">Newsletter name</span>
          <input
            type="text"
            value={doc.name}
            onChange={(event) => { const name = event.target.value; coalesce((d) => ({ ...d, name }), "meta:name"); }}
            className="mt-1 w-56 rounded-[10px] border border-line bg-background px-3 py-2 text-[14px] outline-none focus:border-primary"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-[12px] font-semibold text-text-light">Page background</span>
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(doc.pageBackground) ? doc.pageBackground : "#f4f4f5"}
            onChange={(event) => { const pageBackground = event.target.value; coalesce((d) => ({ ...d, pageBackground }), "meta:bg"); }}
            aria-label="Page background colour"
            className="mt-1 h-10 w-14 cursor-pointer rounded-[10px] border border-line bg-background p-1"
          />
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line p-0.5">
            <SegButton active={view === "edit"} onClick={() => setView("edit")} icon={Pencil} label="Edit" />
            <SegButton active={view === "preview"} onClick={() => setView("preview")} icon={Eye} label="Preview" />
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
              title="Undo (Ctrl+Z)"
              className="ek-btn ek-btn-quiet px-3 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Undo2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Redo"
              title="Redo (Ctrl+Shift+Z)"
              className="ek-btn ek-btn-quiet px-3 py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Redo2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => openInputRef.current?.click()}
            className="ek-btn ek-btn-quiet py-2 text-[13px]"
            title="Open a ZIP you exported from this tool"
          >
            <FolderOpen aria-hidden="true" className="h-4 w-4" />
            Open
          </button>
          <input
            ref={openInputRef}
            type="file"
            accept=".zip,.html,text/html,application/zip"
            className="sr-only"
            aria-label="Open a newsletter you exported from this tool"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void openFile(file);
              event.target.value = "";
            }}
          />
          <button type="button" onClick={startOver} className="ek-btn ek-btn-quiet py-2 text-[13px]">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Start over
          </button>
          <button
            type="button"
            onClick={() => take(copyHtml)}
            disabled={!hasContent}
            className="ek-btn ek-btn-quiet py-2 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
            {copied ? "Copied" : "Copy HTML"}
          </button>
          <button
            type="button"
            onClick={() => take(download)}
            disabled={!hasContent}
            className="ek-btn ek-btn-accent py-2 text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download folder
          </button>
        </div>
      </div>

      <p className="mt-2 text-[13px] text-text-light">
        The export is a ZIP with email safe HTML and its images. To send it you host the images and
        swap the <code>images/...</code> paths for their web addresses, because email cannot read
        local files.
      </p>

      {/* Three panes */}
      <div className="mt-4 flex h-[74vh] min-h-[560px] gap-4">
        <aside className="w-[230px] shrink-0 space-y-6 overflow-y-auto rounded-[12px] border border-line bg-bg-soft p-3">
          <Palette onAdd={(type) => insertBlock(type, doc.blocks.length)} />
          <ImageWorkspace images={doc.images} onAdd={addImages} onRemove={removeImage} />
        </aside>

        <div className="min-w-0 flex-1 overflow-hidden rounded-[12px] border border-line">
          {view === "edit" ? (
            <Canvas
              blocks={doc.blocks}
              images={doc.images}
              pageBackground={doc.pageBackground}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onCommitText={updateBlock}
              onMove={moveBlock}
              onDuplicate={duplicateBlock}
              onRemove={removeBlock}
              onInsertBlock={insertBlock}
              onInsertImage={insertImage}
              onReorder={reorder}
              onPickImage={setPickingFor}
              onDropIntoColumn={onDropIntoColumn}
            />
          ) : (
            <div className="flex h-full flex-col bg-bg-soft">
              <div className="flex items-center justify-center gap-3 border-b border-line bg-background px-3 py-2">
                <div className="flex rounded-full border border-line p-0.5">
                  <SegButton active={previewDevice === "desktop"} onClick={() => setPreviewDevice("desktop")} icon={Monitor} label="Desktop" />
                  <SegButton active={previewDevice === "mobile"} onClick={() => setPreviewDevice("mobile")} icon={Smartphone} label="Mobile" />
                </div>
                <span className="text-[12px] text-text-light">
                  {previewDevice === "mobile" ? "375px phone width. A 600px email scrolls sideways, as it does on a real phone." : "Full width. The email sits at its 600px."}
                </span>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <div
                  className="mx-auto h-full overflow-hidden rounded-[12px] border border-line bg-white shadow-sm transition-[max-width] duration-200"
                  style={{ maxWidth: previewDevice === "mobile" ? 375 : "100%" }}
                >
                  <iframe
                    title="Email preview"
                    src={previewUrl ?? "about:blank"}
                    className="h-full w-full border-0 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="w-[280px] shrink-0 overflow-y-auto rounded-[12px] border border-line bg-bg-soft p-4">
          <Inspector
            block={selected}
            images={doc.images}
            onChange={(patch) => selected && updateBlock(selected.id, patch)}
            onPickImage={() => selected && setPickingFor(selected.id)}
            onClearImage={() => selected && commitBlock(selected.id, { imageId: null } as Partial<Block>)}
            columnOps={{
              setCount: setColumnCount,
              setRatio: setColumnRatio,
              setCellProp: setColumnCellProp,
              setType: setColumnType,
              pickImage: (id) => setPickingFor(id),
            }}
          />
        </aside>
      </div>

      {pickingFor ? (
        <ImagePicker
          images={pickImages}
          onAdd={addImages}
          onPick={(imageId) => {
            commitBlock(pickingFor, { imageId } as Partial<Block>);
            setPickingFor(null);
          }}
          onClose={() => setPickingFor(null)}
        />
      ) : null}

      {pending ? (
        <EmailGate
          actionLabel="Download"
          onDone={() => {
            pending();
            countToolCompleted();
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        />
      ) : null}
    </div>
  );
}

function SegButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Eye; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
        active ? "bg-primary text-white" : "text-text-light hover:text-foreground"
      }`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
      {label}
    </button>
  );
}

function ImagePicker({
  images,
  onAdd,
  onPick,
  onClose,
}: {
  images: NewsletterImage[];
  onAdd: (files: FileList | File[]) => void;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="ek-card w-full max-w-[560px] p-5" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold">Choose an image</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-light hover:bg-bg-soft">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {images.length > 0 ? (
          <ul className="mt-4 grid max-h-[320px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {images.map((image) => (
              <li key={image.id}>
                <button
                  type="button"
                  onClick={() => onPick(image.id)}
                  className="block w-full overflow-hidden rounded-[8px] border border-line hover:border-primary"
                  title={image.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.dataUrl} alt={image.name} className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[14px] text-text-light">No images yet. Add some to place one here.</p>
        )}

        <div className="mt-4">
          <button type="button" onClick={() => inputRef.current?.click()} className="ek-btn ek-btn-quiet py-2 text-[13px]">
            Add images
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            aria-label="Add images from your device"
            onChange={(event) => {
              if (event.target.files) onAdd(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
