"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X, Shuffle, ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import {
  cleanDeck,
  deckFromQuery,
  deckQuery,
  shuffle,
  type Card,
} from "@/lib/study/flashcards";
import { CopyButton, Input, Note } from "./ui";

type Mode = "edit" | "study";

export function FlashcardsTool() {
  const [cards, setCards] = useState<Card[]>([{ term: "", definition: "" }]);
  const [mode, setMode] = useState<Mode>("edit");
  const [shareUrl, setShareUrl] = useState("");

  // Load a deck out of the link on first render.
  useEffect(() => {
    const fromUrl = deckFromQuery(window.location.search);
    if (fromUrl.length > 0) setCards(fromUrl);
  }, []);

  // Keep the link and the share URL in step with the deck, without navigating.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const query = deckQuery(cards);
    const url = `${window.location.origin}${window.location.pathname}${query}`;
    window.history.replaceState(null, "", query || window.location.pathname);
    setShareUrl(cleanDeck(cards).length > 0 ? url : "");
  }, [cards]);

  const setRow = (index: number, patch: Partial<Card>) =>
    setCards((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const addRow = () => setCards((current) => [...current, { term: "", definition: "" }]);
  const removeRow = (index: number) =>
    setCards((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));

  const ready = cleanDeck(cards);

  if (mode === "study" && ready.length > 0) {
    return <StudyMode deck={ready} onExit={() => setMode("edit")} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {cards.map((card, index) => (
          <div key={index} className="flex items-start gap-2">
            <Input
              aria-label={`Term ${index + 1}`}
              value={card.term}
              onChange={(e) => setRow(index, { term: e.target.value })}
              placeholder="Term"
              className="flex-1"
            />
            <Input
              aria-label={`Definition ${index + 1}`}
              value={card.definition}
              onChange={(e) => setRow(index, { definition: e.target.value })}
              placeholder="Definition"
              className="flex-[1.5]"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label={`Remove card ${index + 1}`}
              className="ek-btn ek-btn-quiet mt-0.5 h-9 w-9 shrink-0 justify-center p-0"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={addRow} className="ek-btn ek-btn-quiet">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add a card
        </button>
        <button
          type="button"
          onClick={() => setMode("study")}
          disabled={ready.length === 0}
          className="ek-btn ek-btn-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Study {ready.length > 0 ? `${ready.length} ${ready.length === 1 ? "card" : "cards"}` : ""}
        </button>
      </div>

      {shareUrl ? (
        <div className="rounded-[12px] border border-line bg-bg-soft p-4">
          <p className="text-[14px] font-semibold">Share this deck</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              readOnly
              value={shareUrl}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Share link for this deck"
              className="min-w-0 flex-1 rounded-[10px] border border-line bg-background px-3 py-2 text-[13px] text-text-light outline-none"
            />
            <CopyButton text={shareUrl} label="Copy the share link" className="ek-btn ek-btn-accent shrink-0" />
          </div>
          <Note tone="quiet">
            The whole deck is in that link. Nothing is stored on a server: sharing the deck is
            sending the link, and it works for as long as the link does.
          </Note>
        </div>
      ) : null}
    </div>
  );
}

function StudyMode({ deck, onExit }: { deck: Card[]; onExit: () => void }) {
  const [order, setOrder] = useState<Card[]>(deck);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  const total = order.length;
  const card = order[index];

  const move = useCallback(
    (delta: number) => {
      setFlipped(false);
      setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
    },
    [total],
  );

  const mark = (isKnown: boolean) => {
    setKnown((k) => {
      const next = new Set(k);
      if (isKnown) next.add(index);
      else next.delete(index);
      return next;
    });
    setReviewed((r) => new Set(r).add(index));
    if (index < total - 1) move(1);
  };

  const reshuffle = () => {
    setOrder((current) => shuffle(current));
    setIndex(0);
    setFlipped(false);
    setKnown(new Set());
    setReviewed(new Set());
  };

  // Keyboard: space flips, arrows move.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move]);

  const allReviewed = reviewed.size === total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-[14px] text-text-light">
        <button type="button" onClick={onExit} className="ek-link">
          Back to editing
        </button>
        <span className="tabular-nums">
          Card {index + 1} of {total}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? "Definition, tap to show the term" : "Term, tap to flip to the definition"}
        className="ek-card flex min-h-[220px] items-center justify-center p-6 text-center transition-colors hover:border-line-strong"
      >
        <div>
          <div className="text-[12px] uppercase tracking-wide text-text-light">
            {flipped ? "Definition" : "Term"}
          </div>
          <div className="mt-2 text-[22px] font-semibold leading-snug">
            {flipped ? card.definition || "—" : card.term || "—"}
          </div>
          {known.has(index) ? (
            <div className="mt-3 inline-flex items-center gap-1 text-[13px] text-text-light">
              <Check aria-hidden="true" className="h-3.5 w-3.5" /> marked known
            </div>
          ) : null}
        </div>
      </button>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          disabled={index === 0}
          aria-label="Previous card"
          className="ek-btn ek-btn-quiet h-10 w-10 justify-center p-0 disabled:opacity-40"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => mark(false)} className="ek-btn ek-btn-quiet">
          Still learning
        </button>
        <button type="button" onClick={() => mark(true)} className="ek-btn ek-btn-accent">
          <Check aria-hidden="true" className="h-4 w-4" />
          Known
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          disabled={index === total - 1}
          aria-label="Next card"
          className="ek-btn ek-btn-quiet h-10 w-10 justify-center p-0 disabled:opacity-40"
        >
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 text-[13px] text-text-light">
        <button type="button" onClick={reshuffle} className="inline-flex items-center gap-1 hover:text-primary-dark">
          <Shuffle aria-hidden="true" className="h-3.5 w-3.5" /> Shuffle
        </button>
        <span aria-hidden="true">·</span>
        <span>Space flips, arrow keys move</span>
      </div>

      {allReviewed ? (
        <div className="ek-card p-4 text-center">
          <p className="text-[15px] font-semibold">
            {known.size} of {total} marked known
          </p>
          <button type="button" onClick={reshuffle} className="ek-btn ek-btn-quiet mt-3">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
            Go again, shuffled
          </button>
        </div>
      ) : null}
    </div>
  );
}
