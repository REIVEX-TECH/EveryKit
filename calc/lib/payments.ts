/**
 * The payment seam. All checkout logic lives here and nowhere else.
 *
 * Launch mode (`NEXT_PUBLIC_PAYMENTS_ENABLED` unset or "false"): the download
 * button hands over the clean file and the UI shows a launch-week badge.
 * `startCheckout()` is never reached.
 *
 * Paid mode: the watermarked preview stays free and the clean file is unlocked
 * by Lemon Squeezy's overlay checkout, which runs entirely in the page. Lemon
 * Squeezy is the merchant of record, so no card details touch this app.
 *
 * ## Why the unlock is only for the session
 *
 * There is no backend, so there is nothing to verify a purchase against. The
 * unlock is a variable in this module plus a flag in sessionStorage, which
 * means anyone who wants the file without paying can have it. That is a
 * deliberate v1 trade at $1.99: a webhook, a licence store and a server to
 * check them would cost more to run and maintain than the fraud it prevents.
 *
 * If that stops being true, the seam to change is `hasPaid()` — point it at a
 * licence check instead of sessionStorage and nothing else moves.
 */

export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

export const PRICE_LABEL = "$1.99";

const CHECKOUT_URL = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL ?? "";

const LEMON_JS = "https://assets.lemonsqueezy.com/lemon.js";

/** Survives a reload within the same tab, and nothing beyond it. */
const SESSION_KEY = "everykit-calc-unlocked";

export type CheckoutResult = "paid" | "dismissed";

type LemonSqueezyEvent = { event?: string };

type LemonSqueezyGlobal = {
  Setup: (options: { eventCallback: (event: LemonSqueezyEvent) => void }) => void;
  Url: { Open: (url: string) => void };
  Refresh?: () => void;
};

declare global {
  interface Window {
    LemonSqueezy?: LemonSqueezyGlobal;
    createLemonSqueezy?: () => void;
  }
}

let unlocked = false;

/** True when the clean file has been paid for in this session. */
export function hasPaid(): boolean {
  if (!PAYMENTS_ENABLED) return true;
  if (unlocked) return true;
  if (typeof window === "undefined") return false;
  try {
    unlocked = window.sessionStorage.getItem(SESSION_KEY) === "true";
  } catch {
    // Private browsing can refuse sessionStorage. The in-memory flag still works.
    unlocked = false;
  }
  return unlocked;
}

function markPaid(): void {
  unlocked = true;
  try {
    window.sessionStorage.setItem(SESSION_KEY, "true");
  } catch {
    // Nothing to do; the in-memory flag carries the session.
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load lemon.js once, on the first click, rather than on every page load. */
function loadLemonJs(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    if (window.LemonSqueezy) return resolve();

    const script = document.createElement("script");
    script.src = LEMON_JS;
    script.defer = true;
    script.onload = () => {
      // lemon.js exposes createLemonSqueezy() and expects it to be called
      // before window.LemonSqueezy is usable.
      window.createLemonSqueezy?.();
      resolve();
    };
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Could not reach Lemon Squeezy. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** `?embed=1` is what makes Lemon Squeezy render inline instead of navigating away. */
function overlayUrl(): string {
  const url = new URL(CHECKOUT_URL);
  url.searchParams.set("embed", "1");
  return url.toString();
}

/**
 * Watch for the overlay closing without a purchase.
 *
 * Lemon Squeezy emits `Checkout.Success` but nothing dependable for a
 * dismissal, so this notices its container leaving the DOM. Best effort: if it
 * never fires, the caller simply keeps its "checkout is open" state until the
 * next click, which is why the caller must not block the UI on this promise.
 */
function watchForDismissal(onDismiss: () => void): () => void {
  const observer = new MutationObserver(() => {
    const stillOpen = document.querySelector(
      "[class*='lemonsqueezy'], [id*='lemonsqueezy'], iframe[src*='lemonsqueezy']",
    );
    if (!stillOpen) onDismiss();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => observer.disconnect();
}

let inFlight: Promise<CheckoutResult> | null = null;

/**
 * Open the Lemon Squeezy overlay and resolve once the purchase completes.
 *
 * Resolves "paid" on `Checkout.Success`, having already recorded the unlock, or
 * "dismissed" if the overlay is closed first.
 */
export function startCheckout(): Promise<CheckoutResult> {
  if (!PAYMENTS_ENABLED) {
    return Promise.reject(
      new Error("startCheckout was called while payments are switched off."),
    );
  }
  if (!CHECKOUT_URL) {
    return Promise.reject(
      new Error(
        "This site is missing its checkout link, so nothing can be bought right now.",
      ),
    );
  }

  // A second click while the overlay is already open joins the first attempt
  // rather than stacking another overlay on top of it.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    await loadLemonJs();

    const lemon = window.LemonSqueezy;
    if (!lemon) throw new Error("Lemon Squeezy loaded but did not start.");

    return new Promise<CheckoutResult>((resolve) => {
      let settled = false;
      let stopWatching = () => {};

      const finish = (result: CheckoutResult) => {
        if (settled) return;
        settled = true;
        stopWatching();
        inFlight = null;
        resolve(result);
      };

      lemon.Setup({
        eventCallback: (event) => {
          if (event?.event === "Checkout.Success") {
            markPaid();
            finish("paid");
          }
        },
      });

      lemon.Url.Open(overlayUrl());

      // The overlay is not in the DOM yet on the tick Url.Open returns, so the
      // watcher waits before deciding an absent overlay means "closed".
      setTimeout(() => {
        if (!settled) stopWatching = watchForDismissal(() => finish("dismissed"));
      }, 1500);
    });
  })();

  return inFlight.catch((error) => {
    inFlight = null;
    throw error;
  });
}
