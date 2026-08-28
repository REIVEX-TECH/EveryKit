/**
 * The two SEO pages. Each preloads an output mode so someone arriving from a
 * search for "transparent background" gets the tool already set the way they
 * asked for, rather than a generic page they have to configure.
 */

import type { OutputMode } from "@/lib/background/output";

export type Faq = { q: string; a: string };

export type ModePage = {
  slug: "transparent-background" | "white-background";
  title: string;
  /**
   * The on-page H1, when it should differ from the launcher title. The white
   * page uses this to say the searcher's exact words, "make your background
   * white", while the tile and the cross-links stay the short noun phrase.
   */
  h1?: string;
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  preset: OutputMode;
  faq: Faq[];
};

/** First on every page, because it is the question and the reason this exists. */
const UPLOAD_ANSWER: Faq = {
  q: "Is my photo uploaded?",
  a: "No. The photo is read from your disk, worked on inside the browser tab, and saved back to your disk. There is no server here that could receive it. The one thing that does cross the network is the model itself, coming in the first time you use the tool, and you can watch that in your browser's network tab: model files arrive, no image leaves.",
};

const EDGE_ANSWER: Faq = {
  q: "How good are the edges on hair?",
  a: "Hair and fur are the hard part of this problem and no automatic tool gets them perfect. Fine strands against a busy background are where it struggles most. That is why the result is shown zoomed in on an edge before you download: judge it there rather than after you have used the file somewhere.",
};

const BATCH_ANSWER: Faq = {
  q: "Can I do several at once?",
  a: "Up to five in one go. They run one after another rather than together, because the model is large and several passes at once is how a phone browser runs out of memory.",
};

export const modePages: ModePage[] = [
  {
    slug: "transparent-background",
    title: "Transparent background",
    blurb: "Cut the subject out and keep the transparency",
    seoTitle: "Make a background transparent, free and never uploaded",
    description:
      "Remove the background from a photo and save it as a transparent PNG. Runs in your browser, so the photo is never uploaded.",
    intro: [
      "Drop in a photo and the background comes away, leaving the subject on transparent pixels. The file you get is a PNG with a real alpha channel, so it drops onto any colour or any slide without a white box around it.",
      "The work happens on your own device. Nothing is uploaded.",
    ],
    preset: { kind: "transparent" },
    faq: [
      UPLOAD_ANSWER,
      {
        q: "Will it really be transparent, or just white?",
        a: "Really transparent. The saved file is a PNG whose alpha channel is written from the cutout, and the tests decode that channel out of the encoded bytes to check it rather than trusting the file extension. Put it on a coloured slide and you will see the difference immediately.",
      },
      EDGE_ANSWER,
      BATCH_ANSWER,
      {
        q: "Why is my file bigger than the photo I started with?",
        a: "PNG is lossless and carries a fourth channel for transparency, where a JPG is lossy and carries three. That combination usually costs more bytes. It is the trade for having transparency at all, since JPG cannot store it.",
      },
    ],
  },
  {
    slug: "white-background",
    title: "White background",
    h1: "Make your background white",
    blurb: "Put the subject on a clean white ground",
    seoTitle: "Make photo background white online, free",
    description:
      "Change any photo background to white in your browser, free, nothing uploaded. Other solid colours too.",
    intro: [
      "Drop in a photo and make your background white in one step. The background is removed and replaced with plain white, ready for an ID or passport photo, a product shot, a profile picture, or a form that asks for a white background.",
      "White is the default here. There is also a row of colour presets and a hex box, so any flat colour works the same way. It all happens on your own device, and the photo is never uploaded.",
    ],
    preset: { kind: "colour", hex: "#ffffff" },
    faq: [
      {
        q: "How do I make a photo background white?",
        a: "Drop your photo in above and press the button. The tool removes the background and puts your subject on plain white, which is the default here. Then save the file. It all runs in your browser, so the photo is never uploaded, and there is a row of other colours and a hex box if you want a different one.",
      },
      UPLOAD_ANSWER,
      {
        q: "Is this white good enough for a passport photo?",
        a: "The white is clean and even, but this kit does not check the size, head height and eye position a passport photo needs. For that, EveryKit Photos does the exact sizing and has this same white background replacement built in.",
      },
      EDGE_ANSWER,
      BATCH_ANSWER,
      {
        q: "Can I use a colour that is not white?",
        a: "Yes. There is a row of presets, off white, light grey and more, and a hex box for any exact colour. Three digits or six, with or without the hash.",
      },
    ],
  },
];

const bySlug = new Map(modePages.map((page) => [page.slug, page]));

export function getModePage(slug: string): ModePage | undefined {
  return bySlug.get(slug as ModePage["slug"]);
}

/** How many images one batch may hold. */
export const MAX_BATCH = 5;
