import { describe, expect, it } from "vitest";
import {
  calculateGpa,
  emptyCourse,
  formatGpa,
  nearestLetter,
  pointsFromPercentage,
  type Course,
} from "./gpa";
import { percent, sentence, whatIsNeeded } from "./finalGrade";
import {
  EMPTY_FIELDS,
  apa,
  apaAuthors,
  apaDate,
  build,
  mla,
  mlaAuthors,
  mlaDate,
  parseAuthors,
  parseName,
  toHtml,
  toPlainText,
} from "./citation";
import { analyse, clampWpm, countWords, duration, pagesSentence } from "./reading";
import { clampMinutes, clock, secondsLeft, tabTitle } from "./timer";

function course(credits: string, grade: string, name = ""): Course {
  return { id: Math.random().toString(36), name, credits, grade };
}

describe("GPA", () => {
  it("weights by credits rather than averaging the grades", () => {
    // A 1 credit A and a 4 credit C. The plain average is a B, and the GPA is
    // not: that gap is the entire reason this calculator exists.
    const result = calculateGpa([course("1", "A"), course("4", "C")], "letter");
    expect(formatGpa(result.gpa as number)).toBe("2.40");
    expect(result.totalCredits).toBe(5);
    expect(result.counted).toBe(2);
  });

  it("gives a straight A student a 4.00", () => {
    const result = calculateGpa([course("3", "A"), course("4", "A"), course("3", "A+")], "letter");
    expect(formatGpa(result.gpa as number)).toBe("4.00");
  });

  it("handles half credits", () => {
    const result = calculateGpa([course("1.5", "B"), course("1.5", "A")], "letter");
    expect(formatGpa(result.gpa as number)).toBe("3.50");
  });

  it("says nothing rather than zero when there is nothing to work out", () => {
    expect(calculateGpa([], "letter").gpa).toBeNull();
    expect(calculateGpa([emptyCourse("a"), emptyCourse("b")], "letter").gpa).toBeNull();
  });

  it("leaves an untouched row alone rather than shouting at it", () => {
    const result = calculateGpa([course("3", "A"), emptyCourse("blank")], "letter");
    expect(result.problems).toHaveLength(0);
    expect(formatGpa(result.gpa as number)).toBe("4.00");
  });

  it("rejects zero credits with a message rather than dropping the row", () => {
    const result = calculateGpa([course("3", "A"), course("0", "B")], "letter");
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0].message).toContain("more than zero");
    // The good row still counts, so one mistake does not blank the answer.
    expect(formatGpa(result.gpa as number)).toBe("4.00");
  });

  it("rejects negative and nonsense credits", () => {
    expect(calculateGpa([course("-3", "A")], "letter").problems).toHaveLength(1);
    expect(calculateGpa([course("three", "A")], "letter").problems).toHaveLength(1);
    expect(calculateGpa([course("300", "A")], "letter").problems[0].message).toContain("more credits");
  });

  it("asks for the missing half of a half-filled row", () => {
    expect(calculateGpa([course("3", "")], "letter").problems[0].message).toContain("Pick a grade");
    expect(calculateGpa([course("", "A")], "letter").problems[0].message).toContain("credits");
  });

  it("converts percentages on the usual bands, inclusive at the bottom", () => {
    expect(pointsFromPercentage(97)).toBe(4.0);
    expect(pointsFromPercentage(93)).toBe(4.0);
    expect(pointsFromPercentage(90)).toBe(3.7);
    expect(pointsFromPercentage(89.9)).toBe(3.3);
    expect(pointsFromPercentage(60)).toBe(0.7);
    expect(pointsFromPercentage(59)).toBe(0);
    expect(pointsFromPercentage(0)).toBe(0);
  });

  it("works in percentage mode", () => {
    // 95 is an A at 4.0 and 85 is a B at 3.0, because B plus starts at 87.
    const result = calculateGpa([course("3", "95"), course("3", "85")], "percentage");
    expect(formatGpa(result.gpa as number)).toBe("3.50");
  });

  it("refuses a percentage above 100", () => {
    expect(calculateGpa([course("3", "120")], "percentage").problems[0].message).toContain("above 100");
  });

  it("names the nearest letter, rounding down on a tie", () => {
    expect(nearestLetter(4.0)).toBe("A");
    expect(nearestLetter(3.71)).toBe("A-");
    expect(nearestLetter(2.85)).toBe("B-");
    expect(nearestLetter(0)).toBe("F");
  });
});

describe("what I need on the final", () => {
  it("solves the ordinary case", () => {
    // 85 so far, final worth 30, want 87 overall: 59.5 carried, so 91.7 needed.
    const answer = whatIsNeeded("85", "30", "87");
    expect(answer.kind).toBe("needed");
    if (answer.kind !== "needed") return;
    expect(percent(answer.required)).toBe("91.7%");
  });

  it("is unreachable one target higher, which is the point of saying so", () => {
    // The same student wanting 90 needs 101.7, and no mark on the final gets
    // there. This is the case every other calculator prints as a number.
    expect(whatIsNeeded("85", "30", "90").kind).toBe("unreachable");
  });

  it("is honest when the answer is above 100", () => {
    const answer = whatIsNeeded("60", "20", "90");
    expect(answer.kind).toBe("unreachable");
    if (answer.kind !== "unreachable") return;
    expect(sentence(answer, "90")).toContain("Not reachable with this weighting");
    expect(percent(answer.best)).toBe("68.0%");
  });

  it("says so when the target is already safe", () => {
    // 95 so far with only 10 percent left: even a zero finishes at 85.5.
    const answer = whatIsNeeded("95", "10", "80");
    expect(answer.kind).toBe("already");
    if (answer.kind !== "already") return;
    expect(percent(answer.worst)).toBe("85.5%");
    expect(sentence(answer, "80")).toContain("Even a zero on the final");
  });

  it("calls a low bar a low bar", () => {
    // 85 carried at 75 percent weight leaves 63.75; reaching 70 needs 25.
    const answer = whatIsNeeded("85", "25", "70");
    expect(answer.kind).toBe("needed");
    if (answer.kind !== "needed") return;
    expect(percent(answer.required)).toBe("25.0%");
    expect(answer.comfortable).toBe(true);
    expect(sentence(answer, "70")).toContain("low bar");
  });

  it("never asks for a negative mark", () => {
    const answer = whatIsNeeded("90", "50", "50");
    if (answer.kind === "needed") expect(answer.required).toBeGreaterThanOrEqual(0);
  });

  it("waits quietly until all three are filled in", () => {
    expect(whatIsNeeded("", "30", "90").kind).toBe("incomplete");
    expect(whatIsNeeded("85", "", "90").kind).toBe("incomplete");
    expect(sentence({ kind: "incomplete" }, "90")).toContain("Fill in all three");
  });

  it("refuses weightings that cannot be", () => {
    expect(whatIsNeeded("80", "0", "90")).toMatchObject({ kind: "invalid" });
    expect(whatIsNeeded("80", "120", "90")).toMatchObject({ kind: "invalid" });
    expect(whatIsNeeded("120", "30", "90")).toMatchObject({ kind: "invalid" });
  });

  it("handles a final worth the whole course", () => {
    const answer = whatIsNeeded("0", "100", "70");
    expect(answer.kind).toBe("needed");
    if (answer.kind !== "needed") return;
    expect(percent(answer.required)).toBe("70.0%");
  });
});

describe("citations", () => {
  const text = (fields: Parameters<typeof build>[0], style: Parameters<typeof build>[1]) =>
    toPlainText(build(fields, style));

  it("reads a name typed either way round", () => {
    expect(parseName("Ahmed, Sara")).toEqual({ last: "Ahmed", first: "Sara", middle: "" });
    expect(parseName("Sara Ahmed")).toEqual({ last: "Ahmed", first: "Sara", middle: "" });
    expect(parseName("Sara J. Ahmed")).toEqual({ last: "Ahmed", first: "Sara", middle: "J." });
    expect(parseName("Plato")).toEqual({ last: "Plato", first: "", middle: "" });
    expect(parseName("   ")).toBeNull();
  });

  it("splits authors on new lines and semicolons", () => {
    expect(parseAuthors("Ahmed, Sara\nKhan, Ali; Patel, Riya")).toHaveLength(3);
  });

  describe("APA 7 author lists", () => {
    it("puts initials after the surname", () => {
      expect(apaAuthors(parseAuthors("Sara Ahmed"))).toBe("Ahmed, S.");
      expect(apaAuthors(parseAuthors("Sara Jane Ahmed"))).toBe("Ahmed, S. J.");
    });

    it("keeps the comma before the ampersand with two authors", () => {
      // The rule everybody writes the other way round.
      expect(apaAuthors(parseAuthors("Sara Ahmed\nAli Khan"))).toBe("Ahmed, S., & Khan, A.");
    });

    it("uses commas and an ampersand for three", () => {
      expect(apaAuthors(parseAuthors("Sara Ahmed\nAli Khan\nRiya Patel"))).toBe(
        "Ahmed, S., Khan, A., & Patel, R.",
      );
    });

    it("collapses past twenty with an ellipsis before the last", () => {
      const many = Array.from({ length: 22 }, (_, i) => `First${i} Last${i}`).join("\n");
      const formatted = apaAuthors(parseAuthors(many));
      expect(formatted).toContain("...");
      expect(formatted.endsWith("Last21, F.")).toBe(true);
    });
  });

  describe("MLA 9 author lists", () => {
    it("inverts only the first author", () => {
      expect(mlaAuthors(parseAuthors("Sara Ahmed"))).toBe("Ahmed, Sara");
      expect(mlaAuthors(parseAuthors("Sara Ahmed\nAli Khan"))).toBe("Ahmed, Sara, and Ali Khan");
    });

    it("uses et al. from three authors, which is the MLA 9 rule", () => {
      expect(mlaAuthors(parseAuthors("Sara Ahmed\nAli Khan\nRiya Patel"))).toBe("Ahmed, Sara, et al.");
    });
  });

  it("writes dates the way each style writes them", () => {
    expect(apaDate("2026-08-05")).toBe("August 5, 2026");
    expect(mlaDate("2026-08-05")).toBe("5 Aug. 2026");
    expect(mlaDate("2026-09-01")).toBe("1 Sept. 2026");
    expect(mlaDate("2026-05-01")).toBe("1 May 2026");
    expect(mlaDate("")).toBe("");
    expect(apaDate("nonsense")).toBe("");
  });

  const article = {
    ...EMPTY_FIELDS,
    authors: "Sara Ahmed",
    title: "How students choose a citation style",
    source: "Journal of Study Habits",
    year: "2024",
    url: "https://example.org/article",
  };

  it("formats an article in APA 7", () => {
    expect(text(article, "apa")).toBe(
      "Ahmed, S. (2024). How students choose a citation style. Journal of Study Habits. https://example.org/article",
    );
  });

  it("formats the same article in MLA 9", () => {
    expect(text(article, "mla")).toBe(
      "Ahmed, Sara. “How students choose a citation style.” Journal of Study Habits, 2024, https://example.org/article.",
    );
  });

  it("italicises the container, not the article title", () => {
    const italics = apa(article).filter((s) => s.italic).map((s) => s.text.trim());
    expect(italics).toEqual(["Journal of Study Habits"]);
  });

  it("italicises the title itself when there is no container", () => {
    const book = { ...EMPTY_FIELDS, authors: "Sara Ahmed", title: "A Whole Book", year: "2020" };
    expect(apa(book).filter((s) => s.italic).map((s) => s.text.trim())).toEqual(["A Whole Book."]);
    expect(mla(book).filter((s) => s.italic).map((s) => s.text.trim())).toEqual(["A Whole Book"]);
  });

  it("uses n.d. in APA when there is no year", () => {
    expect(text({ ...article, year: "" }, "apa")).toContain("(n.d.)");
  });

  it("adds an access date in the shape each style wants", () => {
    const withAccess = { ...article, accessed: "2026-08-05" };
    expect(text(withAccess, "apa")).toContain("Retrieved August 5, 2026, from https://example.org/article");
    expect(text(withAccess, "mla")).toContain("Accessed 5 Aug. 2026.");
  });

  it("does not leave stray punctuation when fields are missing", () => {
    const sparse = { ...EMPTY_FIELDS, title: "Just a title" };
    for (const style of ["apa", "mla"] as const) {
      const out = text(sparse, style);
      expect(out).not.toMatch(/,\s*[,.]/);
      expect(out).not.toMatch(/\.\s*\./);
      expect(out).not.toMatch(/[\s,]$/);
    }
  });

  it("produces nothing at all from nothing at all", () => {
    expect(text(EMPTY_FIELDS, "mla")).toBe("");
  });

  it("keeps the italics in the rich text copy and drops them in the plain one", () => {
    const html = toHtml(build(article, "apa"));
    expect(html).toContain("<i>Journal of Study Habits</i>");
    expect(toPlainText(build(article, "apa"))).not.toContain("<i>");
  });

  it("escapes markup somebody types into a field", () => {
    const nasty = { ...EMPTY_FIELDS, title: "A <script> in the title & more" };
    expect(toHtml(build(nasty, "mla"))).not.toContain("<script>");
    expect(toHtml(build(nasty, "mla"))).toContain("&lt;script&gt;");
  });

  it("does not double the full stop when a title already ends in one", () => {
    const dotted = { ...article, title: "Ends in a full stop." };
    expect(text(dotted, "apa")).toContain("Ends in a full stop. Journal");
    expect(text(dotted, "mla")).toContain("“Ends in a full stop.”");
  });
});

describe("reading time", () => {
  it("counts words the way the counter does", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords("  padded   out  ")).toBe(2);
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("divides by the pace", () => {
    const result = analyse(400, 200, 130);
    expect(result.readingMinutes).toBe(2);
    expect(result.speakingMinutes).toBeCloseTo(3.08, 2);
  });

  it("keeps the pace inside sensible bounds", () => {
    expect(clampWpm(0, 200)).toBe(50);
    expect(clampWpm(99999, 200)).toBe(1000);
    expect(clampWpm(Number.NaN, 200)).toBe(200);
    expect(clampWpm(275.4, 200)).toBe(275);
  });

  it("says short times in seconds and long ones in hours", () => {
    expect(duration(0)).toBe("no time at all");
    expect(duration(0.5)).toBe("30 seconds");
    expect(duration(1)).toBe("1 minute");
    expect(duration(2.5)).toBe("2 minutes 30 seconds");
    expect(duration(60)).toBe("1 hour");
    expect(duration(94)).toBe("1 hour 34 minutes");
  });

  it("gives pages at both spacings and names the assumptions", () => {
    const result = analyse(1000, 200, 130);
    expect(result.doubleSpacedPages).toBe(4);
    expect(result.singleSpacedPages).toBe(2);
    const line = pagesSentence(result);
    expect(line).toContain("12 point");
    expect(line).toContain("one inch margins");
    expect(line).toContain("guide rather than a measurement");
  });

  it("says nothing about pages when there is no text", () => {
    expect(pagesSentence(analyse(0, 200, 130))).toBe("");
  });
});

describe("the timer", () => {
  it("counts down from the clock rather than from a counter", () => {
    const started = 1_000_000;
    expect(secondsLeft(25, started, 0, started)).toBe(1500);
    expect(secondsLeft(25, started, 0, started + 60_000)).toBe(1440);
    // A tab that was hidden for ten minutes comes back with the right answer,
    // which a per-second counter would not.
    expect(secondsLeft(25, started, 0, started + 600_000)).toBe(900);
  });

  it("never goes below zero", () => {
    expect(secondsLeft(1, 0, 0, 999_999)).toBe(0);
  });

  it("carries the time already served across a pause", () => {
    expect(secondsLeft(25, null, 300, 0)).toBe(1200);
    expect(secondsLeft(25, 1000, 300, 61_000)).toBe(1140);
  });

  it("formats as m:ss", () => {
    expect(clock(1500)).toBe("25:00");
    expect(clock(61)).toBe("1:01");
    expect(clock(9)).toBe("0:09");
    expect(clock(0)).toBe("0:00");
    expect(clock(-5)).toBe("0:00");
  });

  it("puts the countdown in the tab title while it runs", () => {
    expect(tabTitle(1500, "focus", true)).toBe("25:00 focus | EveryKit Study");
    expect(tabTitle(300, "break", true)).toBe("5:00 break | EveryKit Study");
    expect(tabTitle(0, "focus", false)).toBe("EveryKit Study");
  });

  it("keeps the lengths sensible", () => {
    expect(clampMinutes(0)).toBe(1);
    expect(clampMinutes(500)).toBe(120);
    expect(clampMinutes(25.6)).toBe(26);
    expect(clampMinutes(Number.NaN)).toBe(25);
  });
});

describe("citations for video, podcast and newspaper", () => {
  const text = (fields: Parameters<typeof build>[0], style: Parameters<typeof build>[1]) =>
    toPlainText(build(fields, style));

  // Modelled on the APA Style blog and Purdue OWL published examples.
  it("formats a YouTube video in APA 7", () => {
    const out = text(
      {
        ...EMPTY_FIELDS,
        sourceType: "video",
        contributor: "Harvard University",
        title: "Soft robotic gripper for jellyfish",
        source: "YouTube",
        published: "2019-08-28",
        url: "https://youtu.be/example",
      },
      "apa",
    );
    expect(out).toBe(
      "Harvard University. (2019, August 28). Soft robotic gripper for jellyfish [Video]. YouTube. https://youtu.be/example",
    );
  });

  it("formats a YouTube video in MLA 9", () => {
    const out = text(
      {
        ...EMPTY_FIELDS,
        sourceType: "video",
        contributor: "Harvard University",
        title: "Soft robotic gripper for jellyfish",
        source: "YouTube",
        published: "2019-08-28",
        url: "https://youtu.be/example",
      },
      "mla",
    );
    expect(out).toBe(
      "\u201cSoft robotic gripper for jellyfish.\u201d YouTube, uploaded by Harvard University, 28 Aug. 2019, https://youtu.be/example.",
    );
  });

  it("formats a podcast episode in APA 7 with the show italicised", () => {
    const fields = {
      ...EMPTY_FIELDS,
      sourceType: "podcast" as const,
      authors: "Koenig, Sarah",
      title: "The alibi",
      source: "Serial",
      published: "2014-10-03",
      url: "https://serialpodcast.org/season-one/1",
    };
    const out = text(fields, "apa");
    expect(out).toBe(
      "Koenig, S. (2014, October 3). The alibi [Audio podcast episode]. In Serial. https://serialpodcast.org/season-one/1",
    );
    // The container is italic; the episode title is not.
    const segs = build(fields, "apa");
    expect(segs.some((s) => s.italic && s.text.includes("Serial"))).toBe(true);
  });

  it("formats a podcast episode in MLA 9", () => {
    const out = text(
      {
        ...EMPTY_FIELDS,
        sourceType: "podcast",
        authors: "Koenig, Sarah",
        title: "The alibi",
        source: "Serial",
        published: "2014-10-03",
        url: "https://serialpodcast.org/season-one/1",
      },
      "mla",
    );
    expect(out).toBe(
      "Koenig, Sarah. \u201cThe alibi.\u201d Serial, 3 Oct. 2014, https://serialpodcast.org/season-one/1.",
    );
  });

  it("formats a newspaper article in APA 7", () => {
    const out = text(
      {
        ...EMPTY_FIELDS,
        sourceType: "newspaper",
        authors: "Guarino, Ben",
        title: "How the coronavirus spreads",
        source: "The Washington Post",
        published: "2020-05-08",
        url: "https://washingtonpost.com/example",
      },
      "apa",
    );
    expect(out).toBe(
      "Guarino, B. (2020, May 8). How the coronavirus spreads. The Washington Post. https://washingtonpost.com/example",
    );
  });

  it("formats a newspaper article in MLA 9", () => {
    const out = text(
      {
        ...EMPTY_FIELDS,
        sourceType: "newspaper",
        authors: "Guarino, Ben",
        title: "How the coronavirus spreads",
        source: "The Washington Post",
        published: "2020-05-08",
        url: "https://washingtonpost.com/example",
      },
      "mla",
    );
    expect(out).toBe(
      "Guarino, Ben. \u201cHow the coronavirus spreads.\u201d The Washington Post, 8 May 2020, https://washingtonpost.com/example.",
    );
  });

  it("falls back to n.d. when a video has no date", () => {
    const out = text(
      { ...EMPTY_FIELDS, sourceType: "video", contributor: "Someone", title: "A clip", source: "YouTube" },
      "apa",
    );
    expect(out).toContain("(n.d.)");
  });
});
