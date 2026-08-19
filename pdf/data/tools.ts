/**
 * The six PDF tools. One entry per route, and the single source for the
 * landing tiles, the routes themselves, and their SEO pages.
 */

export type ToolSlug =
  | "merge"
  | "split"
  | "extract"
  | "organize"
  | "images-to-pdf"
  | "compress";

export type Faq = { q: string; a: string };

export type Tool = {
  slug: ToolSlug;
  title: string;
  /** One line, on the tile. */
  blurb: string;
  /** The <title>, before the brand suffix. */
  seoTitle: string;
  description: string;
  /** Shown above the tool. */
  intro: string[];
  faq: Faq[];
  /** Accepts more than one file. */
  multiple: boolean;
  accept: string;
};

/**
 * The answer that goes first on every page, because it is the question people
 * actually have and the reason this kit exists.
 */
const UPLOAD_ANSWER: Faq = {
  q: "Are my files uploaded?",
  a: "No. Everything happens inside your browser tab. The file is read from your disk, worked on in memory, and saved back to your disk. It is never sent to us or to anyone else, and there is no server here that could receive it. You can confirm it yourself: open your browser's developer tools, look at the Network tab, and run any tool. No request carries your file.",
};

export const tools: Tool[] = [
  {
    slug: "merge",
    title: "Merge PDFs",
    blurb: "Combine files into one, in the order you choose",
    seoTitle: "Merge PDF files online, free, and never uploaded",
    description:
      "Combine PDFs into a single file, reordering them first. Runs entirely in your browser, so nothing is uploaded.",
    intro: [
      "Drop in the files you want joined, drag them into the order you want, and download one PDF.",
      "The work happens on your own device. A rent contract and a passport scan are handled the same way as anything else, because neither ever leaves the tab.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "How many files can I merge?", a: "Twenty in one go, and up to 60 MB in total. Beyond that the browser starts to struggle with memory, so the tool says so rather than freezing." },
      { q: "Does the order matter?", a: "Yes, and you set it. Drag the files into the order you want before merging; the result follows that order exactly." },
      { q: "Will it change the quality?", a: "No. Pages are copied across as they are, with the same text, the same images and the same resolution. Merging is not a re-encode." },
      { q: "What about password-protected files?", a: "A file that needs a password to open cannot be read. Remove the password in your PDF reader first, then merge." },
    ],
    multiple: true,
    accept: "application/pdf",
  },
  {
    slug: "split",
    title: "Split a PDF",
    blurb: "Cut one file into several, by page ranges",
    seoTitle: "Split a PDF by page range, free, and never uploaded",
    description:
      "Split a PDF into separate files by page range, or pull every page into its own file. Runs in your browser; nothing is uploaded.",
    intro: [
      "Type the ranges you want. Typing 1-3, 4-6 gives you two files. You can also split every page into its own file.",
      "Nothing is uploaded. The file is opened, cut and saved without leaving your device.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "How do I write the page ranges?", a: "Separate each output file with a comma: \"1-3, 4-6\" gives two files. A bare number is a single page, and \"8-\" means from page 8 to the end." },
      { q: "Can I get every page as its own file?", a: "Yes. There is a button for it, which saves typing out every number on a long document." },
      { q: "How do I get several files at once?", a: "Each part downloads separately, one click each, so you can see what you are getting before you take it." },
      { q: "Does splitting lose quality?", a: "No. Pages are copied unchanged into the new files." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "extract",
    title: "Extract pages",
    blurb: "Pick the pages you want into a new PDF",
    seoTitle: "Extract pages from a PDF, free, and never uploaded",
    description:
      "Select the pages you want and save them as a new PDF. Runs in your browser, so the file is never uploaded.",
    intro: [
      "Tap the pages you want and download them as one new file. Useful when you need three pages out of a forty-page statement.",
      "The pages are read and written on your device. Nothing is sent anywhere.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Does the original file change?", a: "No. The file on your disk is untouched; extracting writes a new one." },
      { q: "Can I choose the order?", a: "The pages come out in document order. To reorder them, use the organise tool on the result." },
      { q: "Is there a page limit?", a: "Thumbnails are rendered for the first 300 pages, which covers almost everything. Larger documents still work, you just pick by number rather than by picture." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "organize",
    title: "Organise pages",
    blurb: "Reorder and rotate the pages of one file",
    seoTitle: "Reorder and rotate PDF pages, free, and never uploaded",
    description:
      "Drag pages into a new order and rotate the ones that came in sideways. Runs in your browser; nothing is uploaded.",
    intro: [
      "Drag pages into the order you want, turn the ones that scanned sideways, and remove any you do not need.",
      "The rotation is written into the file, not just the preview, so it opens the right way up everywhere.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Does the rotation stick?", a: "Yes. It is written into the page itself, so the file opens the right way up in any reader, not only in this preview." },
      { q: "Can I delete pages here?", a: "Yes. Remove a page from the list and it is left out of the result." },
      { q: "What if a page was already rotated?", a: "Turning it adds to the rotation it already had, so the buttons turn what you can actually see." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "images-to-pdf",
    title: "Images to PDF",
    blurb: "Turn photos into one PDF, in your order",
    seoTitle: "Convert JPG and PNG images to PDF, free, and never uploaded",
    description:
      "Turn JPG, PNG or WebP images into a single PDF at A4, Letter, or fitted to each image. Runs in your browser.",
    intro: [
      "Drop in photos or scans, put them in order, and get one PDF. Choose A4 or Letter if it is going to be printed, or fit each page to its image if it is going to be read on screen.",
      "The images are read and the PDF is written on your device.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Which image formats work?", a: "JPG, PNG and WebP. WebP is converted to PNG first, since PDF has no native WebP support." },
      { q: "Which page size should I pick?", a: "A4 or Letter if the result will be printed, with each image centred on a standard page. Fit-to-image if it will be read on a screen, which avoids white borders." },
      { q: "Are the images re-compressed?", a: "JPGs are embedded as they are, with no quality loss. PNGs are embedded losslessly. WebP is converted to PNG, which is also lossless." },
    ],
    multiple: true,
    accept: "image/jpeg,image/png,image/webp",
  },
  {
    slug: "compress",
    title: "Compress a PDF",
    blurb: "Make a file smaller by re-encoding its images",
    seoTitle: "Compress a PDF, free, and never uploaded",
    description:
      "Shrink a PDF by re-encoding the images inside it. Shows the real before and after size. Runs in your browser.",
    intro: [
      "This works by re-encoding the pictures inside a PDF at a lower resolution and quality. It is the only thing that meaningfully shrinks most files.",
      "How much it saves depends entirely on what is in the document. A scanned contract full of page images can drop a long way; a text document that is already efficient will barely move, and the tool tells you that instead of pretending otherwise.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "How much smaller will my file get?", a: "It depends on the file and nobody can promise a figure. Scans and image-heavy documents often drop a lot; a text-only PDF may shrink by a few percent or not at all, because there are no images in it to re-encode. The tool shows the true before and after sizes either way." },
      { q: "Why did my file barely shrink?", a: "Almost certainly because it is mostly text. Text in a PDF is already stored compactly, and there is nothing this tool can do about it without turning your text into pictures, which would make the file worse to read and often larger." },
      { q: "Will the text still be selectable?", a: "Yes. Only the images are touched; text and vector graphics are left exactly as they are." },
      { q: "Which setting should I use?", a: "\"Good for email\" is the safe default. \"Smallest\" is worth it when the document is a scan you only need to be readable. On an image-heavy document the strongest setting is visibly softer, and the tool warns you before you use it." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}

/** Free without limits below these; past them the session unlock applies. */
export const FREE_FILE_LIMIT = 20;
export const FREE_BYTES_LIMIT = 60 * 1024 * 1024;
