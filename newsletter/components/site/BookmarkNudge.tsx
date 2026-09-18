"use client";

import { useEffect, useState } from "react";

/**
 * A quiet, dismissible one-line nudge to add EveryKit to the home screen.
 *
 * Most of the traffic is mobile search, and a home-screen icon is the cheapest
 * honest way back. It is not a modal: a small bar at the bottom that never
 * blocks the page, shown once, on small screens only, and only when the app is
 * not already installed. Dismissing it, or installing, remembers the choice in
 * localStorage so it does not nag.
 *
 * Where the browser supports it (Android Chrome), the "Add" button triggers the
 * real install prompt through the captured `beforeinstallprompt` event. On iOS,
 * where there is no such event, it shows the one-line manual hint instead.
 */

type InstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: string }>;
};

const DISMISSED_KEY = "ek_nudge_dismissed";

export function BookmarkNudge() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<InstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      // If storage is refused we simply do not persist the dismissal.
    }

    // Mobile only: a home-screen icon is a phone affordance.
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    // Already installed and launched from the home screen: nothing to nudge.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIos(isIos);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS never fires that event, so the hint is shown directly there.
    if (isIos) setVisible(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Nothing to do; it reappears next visit, which is survivable.
    }
    setVisible(false);
  }

  async function install() {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // The choice does not matter to us; either way we stop nudging.
    }
    setDeferred(null);
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-[420px] rounded-[12px] border border-line bg-background p-3 shadow-card sm:hidden">
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-[13px] text-text-light">
          {deferred
            ? "Add EveryKit to your home screen for one tap back."
            : ios
              ? "Add to your home screen: tap Share, then Add to Home Screen."
              : "Bookmark EveryKit so it is one tap away."}
        </p>
        {deferred ? (
          <button type="button" onClick={install} className="ek-btn ek-btn-accent shrink-0 px-3 py-1.5 text-[13px]">
            Add
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="-m-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-light hover:bg-bg-soft hover:text-foreground"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
