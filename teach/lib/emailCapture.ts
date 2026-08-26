/**
 * The email ask that stands in front of a download.
 *
 * The single rule that matters here: this never blocks the product. Every path
 * through `submitEmail` resolves, none of them throw, and the caller hands over
 * the file whatever comes back. A hub that is down, a request that hangs, an ad
 * blocker eating the call — all of it ends with the user getting what they came
 * for, because a lead is worth less than a working tool.
 */

import { HUB_URL, KIT_SLUG } from "./site";

/** Asked once per session, then never again in that tab. */
const SESSION_KEY = "ek_email_given";

/** Past this the request is abandoned and the download proceeds. */
const TIMEOUT_MS = 3000;

/**
 * Which kit this is, recorded so the hub knows what brought someone in.
 *
 * Taken from KIT_SLUG rather than written out again. Four kits shipped with a
 * copied literal still saying "pdf", which quietly filed their signups under
 * the wrong kit, and a second copy of a value is the only way that happens.
 */
const KIT = KIT_SLUG;

export const MAX_EMAIL_LENGTH = 254;

/**
 * Mirrors the server's rule. Kept deliberately loose: the cost of rejecting a
 * real address in the browser is a lost signup, the cost of accepting an odd
 * one is a row we never mail.
 */
const EMAIL_PATTERN = /^[^\s@,;:<>()[\]\\"]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isValidEmail(input: string): boolean {
  const email = input.trim().toLowerCase();
  if (email === "" || email.length > MAX_EMAIL_LENGTH) return false;
  if (!EMAIL_PATTERN.test(email)) return false;
  const [local] = email.split("@");
  return !local.startsWith(".") && !local.endsWith(".") && !local.includes("..");
}

export function hasGivenEmail(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    // Private browsing can refuse storage. Asking twice is a small annoyance;
    // throwing here would be a broken download.
    return false;
  }
}

export function rememberEmailGiven(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Nothing to do. The ask reappears next action, which is survivable.
  }
}

/**
 * Send the address to the hub. Resolves either way, always.
 *
 * The return value says whether the hub took it, which is used for nothing more
 * than logging intent — the caller proceeds regardless. There is deliberately
 * no retry: a second attempt would delay the download for a lead we already
 * decided we can live without.
 */
export async function submitEmail(email: string, honeypot: string): Promise<boolean> {
  // A filled honeypot is a bot, so skip the round trip entirely. The server
  // absorbs it too, in case the form is posted directly.
  if (honeypot.trim() !== "") return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${HUB_URL}/api/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), kit: KIT, honeypot: "" }),
      signal: controller.signal,
      credentials: "omit",
      keepalive: true,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Where a submit is counted, sent through the very same aggregate hit as a page
 * view: a kit and a path and nothing else, so a submit is as anonymous as any
 * page count. The `_event` prefix is a namespace no real page uses, which keeps
 * this conversion signal filterable from ordinary traffic. Submit is the only
 * event: the gate is mandatory, so there is nothing else to count.
 */
export const GATE_SUBMIT_EVENT = "/_event/email-submit";

/**
 * The two ways out of the gate. There is no skip: submit is the only path that
 * completes the action, and cancel is the only path that abandons it.
 */
export type GateChoice = "submit" | "cancel";

export type GateOutcome = {
  /** Post the typed address to the hub. Only a submit does. */
  sendEmail: boolean;
  /** Mark the session so the gate does not ask again. Only a submit does. */
  remember: boolean;
  /** Run what the person asked for, the download or the copy. */
  runAction: boolean;
  /** The aggregate hit path for this choice, or null when nothing is counted. */
  countPath: string | null;
};

/**
 * What each way out of the gate does. The dialog reads this rather than
 * deciding inline, so the one place that defines the trade is also the place a
 * test can pin.
 *
 * The gate is mandatory. A submit sends the address, marks the session, counts
 * the one event, and runs the action; it is the only route to the file. A
 * cancel abandons: it runs nothing and marks nothing, so the ask returns on the
 * next action. There is no third way past.
 */
export function gateOutcome(choice: GateChoice): GateOutcome {
  switch (choice) {
    case "submit":
      return { sendEmail: true, remember: true, runAction: true, countPath: GATE_SUBMIT_EVENT };
    case "cancel":
      return { sendEmail: false, remember: false, runAction: false, countPath: null };
  }
}
