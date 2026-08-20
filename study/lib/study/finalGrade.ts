/**
 * What do I need on the final.
 *
 * One equation, rearranged. If the final is worth w of the course and
 * everything else so far is c, then the course mark is c(1 - w) + fw, and
 * solving for f gives (target - c(1 - w)) / w.
 *
 * The interesting part is not the algebra, it is answering honestly when the
 * number comes out above 100. Most calculators print "you need 137%" and leave
 * it there, which is technically a number and practically useless. This says it
 * is not reachable, and says what the best possible outcome is instead.
 */

export type Answer =
  | { kind: "needed"; required: number; comfortable: boolean }
  | { kind: "already"; best: number; worst: number }
  | { kind: "unreachable"; required: number; best: number }
  | { kind: "incomplete" }
  | { kind: "invalid"; message: string };

function parse(raw: string): number | null {
  const text = raw.trim();
  if (text === "") return null;
  if (!/^\d*\.?\d+$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

/**
 * Work out the mark needed on the final.
 *
 * All three inputs are percentages. The weight is the share of the whole course
 * the final carries, so 30 means the final is 30 percent of the grade and
 * everything already done is the other 70.
 */
export function whatIsNeeded(currentRaw: string, weightRaw: string, targetRaw: string): Answer {
  const current = parse(currentRaw);
  const weight = parse(weightRaw);
  const target = parse(targetRaw);

  if (current === null || weight === null || target === null) return { kind: "incomplete" };

  if (weight <= 0) {
    return {
      kind: "invalid",
      message: "If the final is worth nothing, it cannot change your grade. Check the weight.",
    };
  }
  if (weight > 100) {
    return { kind: "invalid", message: "The final cannot be worth more than the whole course." };
  }
  if (current > 100 || target > 100) {
    return { kind: "invalid", message: "A percentage cannot be above 100." };
  }

  const share = weight / 100;
  const carried = current * (1 - share);

  // What the course ends at if the final is perfect, and if it is zero.
  const best = carried + 100 * share;
  const worst = carried;

  const required = (target - carried) / share;

  if (worst >= target) return { kind: "already", best, worst };
  if (required > 100) return { kind: "unreachable", required, best };

  // Under about 40 is a mark almost anybody clears, which is worth saying
  // rather than leaving somebody to worry at a number they have already beaten.
  return { kind: "needed", required: Math.max(0, required), comfortable: required <= 40 };
}

/** One decimal place. Two would imply a precision the inputs do not have. */
export function percent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** The answer as the single sentence the page prints. */
export function sentence(answer: Answer, target: string): string {
  switch (answer.kind) {
    case "incomplete":
      return "Fill in all three and the answer appears here.";
    case "invalid":
      return answer.message;
    case "already":
      return `You have already passed ${target}%. Even a zero on the final leaves you at ${percent(
        answer.worst,
      )}.`;
    case "unreachable":
      return `Not reachable with this weighting. You would need ${percent(
        answer.required,
      )} on the final, and the highest the course can end at is ${percent(answer.best)}.`;
    case "needed":
      return answer.comfortable
        ? `You need ${percent(answer.required)} on the final, which is a low bar.`
        : `You need ${percent(answer.required)} on the final to finish at ${target}%.`;
  }
}
