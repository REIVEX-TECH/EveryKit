/**
 * The three routes. One entry each, and the single source for the tool
 * switcher and the SEO pages.
 */

export type ToolSlug = "draw" | "type" | "sign-pdf";

export type Faq = { q: string; a: string };

export type Tool = {
  slug: ToolSlug;
  /** The path. The drawing tool is the home page. */
  href: string;
  title: string;
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
};

const PRIVACY_ANSWER: Faq = {
  q: "Does my signature get uploaded?",
  a: "No. The drawing, the image and the PDF are all handled inside this browser tab. There is no server here that could receive them, and you can watch the network tab while you work: no request carries any of it.",
};

const LEGAL_ANSWER: Faq = {
  q: "Is a signature made here legally binding?",
  a: "That depends entirely on where you are and what you are signing, and this tool cannot answer it. What it makes is an image of your signature placed on a document, which is what most people mean by signing a PDF. It is not a cryptographic digital signature and does not certify who signed or when. If you need that, you need a service built for it.",
};

export const tools: Tool[] = [
  {
    slug: "draw",
    href: "/",
    title: "Draw",
    blurb: "Sign with a finger, stylus or mouse",
    seoTitle: "Signature maker, draw and download as PNG or SVG",
    description:
      "Draw your signature and download it as a transparent PNG or an SVG. Nothing is uploaded.",
    intro: [
      "Sign in the box with a finger, a stylus or the mouse. Undo takes back one stroke at a time.",
      "The download is cropped to the ink and drawn at three times size, so it stays sharp when it is printed.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "Why does my signature not get thicker when I press harder?",
        a: "Pressure is deliberately ignored. It is absent on a mouse, inconsistent between styluses, and reported as a flat middle value by many touchscreens, so varying the line by it makes the same signature look different depending on the hardware rather than the person.",
      },
      {
        q: "PNG or SVG?",
        a: "PNG for putting into a document, an email or another tool: everything reads it, and the background is genuinely transparent. SVG when it might be printed large or scaled, because it stays sharp at any size. A drawn signature makes a real SVG path, so the curve is the curve you drew.",
      },
      LEGAL_ANSWER,
    ],
  },
  {
    slug: "type",
    href: "/type",
    title: "Type",
    blurb: "Type your name in a handwriting face",
    seoTitle: "Type a signature, four handwriting fonts, free download",
    description:
      "Type your name and pick a handwriting face. Download as a transparent PNG or a self-contained SVG.",
    intro: [
      "Type your name and choose one of four handwriting faces. Useful when you have no touchscreen and a mouse signature looks nothing like yours.",
      "A typed signature looks typed, and anyone comparing it to a real one will see that. Drawing is better when it matters.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "Will the SVG look right on someone else's computer?",
        a: "Yes. The font is embedded in the file itself rather than named and hoped for, so it renders correctly on a machine that has never had that font installed and makes no request to load it. If the font cannot be embedded for any reason the tool tells you rather than handing you a file that quietly falls back to Times New Roman.",
      },
      {
        q: "Which fonts are these?",
        a: "Four open licensed handwriting faces from Google Fonts, served from this site rather than from Google, so using this page does not tell anyone else you were here.",
      },
      LEGAL_ANSWER,
    ],
  },
  {
    slug: "sign-pdf",
    href: "/sign-pdf",
    title: "Sign a PDF",
    blurb: "Put your signature on a document",
    seoTitle: "Sign a PDF online free, nothing uploaded",
    description:
      "Add your signature to a PDF in your browser. Pick the page, place the signature, download the signed file.",
    intro: [
      "Open a PDF, pick the page, drag the signature where it goes, and download the signed file. The document never leaves your device.",
      "The signature is flattened into the page rather than added as an annotation, so it cannot be dragged off or deleted in a reader, and it prints.",
    ],
    faq: [
      PRIVACY_ANSWER,
      {
        q: "Can I sign in more than one place?",
        a: "Yes. Place the same signature as many times as you need, on any pages. It is embedded once however many times it appears, so signing ten pages barely changes the file size.",
      },
      {
        q: "Can I use two different signatures in one document?",
        a: "Not in this version. One signature, placed as often as you like. Two people signing the same document means signing it twice, one after the other.",
      },
      {
        q: "What about a password-protected PDF?",
        a: "A file that needs a password to open cannot be read here. Remove the password in your PDF reader first, then sign it.",
      },
      LEGAL_ANSWER,
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
