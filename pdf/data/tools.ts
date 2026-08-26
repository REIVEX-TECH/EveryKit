/**
 * The ten PDF tools. One entry per route, and the single source for the
 * landing tiles, the routes themselves, their sitemap entries and their SEO
 * pages. Adding a tool here is all there is to adding a tool.
 */

/** The tools that run through the shared PDF-operation Workbench. */
export type PdfToolSlug =
  | "merge"
  | "split"
  | "extract"
  | "organize"
  | "delete-pages"
  | "page-numbers"
  | "watermark"
  | "pdf-to-images"
  | "images-to-pdf"
  | "compress";

/** Every tool slug, including the two with their own bespoke workbenches. */
export type ToolSlug = PdfToolSlug | "scan" | "ocr";

export type Faq = { q: string; a: string };

/**
 * The shelf a tool sits on. The landing groups by these so twelve tools read as
 * four short, labelled sets rather than one grid, which is easier to scan. The
 * order here is the order the sections appear.
 */
export type Category = "read" | "pages" | "convert" | "finish";

export const CATEGORIES: Array<{ id: Category; label: string }> = [
  { id: "read", label: "Scan and read" },
  { id: "pages", label: "Combine and split" },
  { id: "convert", label: "Convert" },
  { id: "finish", label: "Edit and shrink" },
];

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
  category: Category;
  /**
   * Which component renders the tool. Absent means the shared PDF Workbench;
   * scan and ocr have their own, because neither takes a PDF and hands back
   * another one the way the ten operations do.
   */
  render?: "scan" | "ocr";
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
    slug: "scan",
    category: "read",
    title: "Scan with your phone",
    blurb: "Photos of pages into a straightened PDF",
    seoTitle: "Scan documents with your phone camera, free, and never uploaded",
    description:
      "Turn photos of pages into a straightened, high-contrast PDF. Drag the corners to crop each page, pick a look, and export one PDF. Runs in your browser.",
    intro: [
      "Take a photo of each page, drop the photos in, and drag the four corners to mark where the page sits. Each one is straightened as if it had been laid flat on a scanner.",
      "Pick a look for all of them, order them the way you want, and download one PDF. The photos are read and the PDF is written on your device, so nothing is uploaded.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "How do I mark the page?", a: "Each photo shows four corner handles. Drag them onto the corners of the page in the picture, and the tool straightens the quadrilateral you marked into an upright rectangle. The handles start a little inside the photo, so most pages need only a nudge." },
      { q: "What do the three looks do?", a: "Original keeps the photo as it is. Grayscale drops the colour, which suits a page you want to keep looking like a photo. Scan turns it to near black and white the way a flatbed would, and it adjusts to uneven lighting so the shadowed side of a page does not go solid black." },
      { q: "Can I scan more than one page?", a: "Yes. Add as many photos as you like, drag them into order, and they become the pages of one PDF in that order." },
      { q: "Why does the straightened page look soft?", a: "A photo has only so much detail, and straightening stretches part of it. Hold the camera square and fill the frame with the page for the sharpest result. The scan look then cleans up most of what is left." },
    ],
    multiple: true,
    accept: "image/jpeg,image/png,image/webp",
    render: "scan",
  },
  {
    slug: "ocr",
    category: "read",
    title: "Get the text out (OCR)",
    blurb: "Copyable text from an image or a PDF page",
    seoTitle: "Image and PDF to text with OCR, free, and never uploaded",
    description:
      "Read the words out of a photo or a PDF page into text you can copy, in English or Urdu. Recognition runs in your browser, so the file is never uploaded.",
    intro: [
      "Drop in a photo or a PDF, pick the language, and the words are read into text you can copy. The recogniser runs in your browser, so the page never leaves your device.",
      "It works best on clear, printed text that is roughly upright. Handwriting, faint scans and heavy layout are where any recogniser struggles, and this one will too, so check the result against the original before you rely on it.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "How accurate is it?", a: "On a clean photo of printed text it is good, usually most words correct. On a faint scan, an unusual font, or handwriting it drops off, as every recogniser does. Treat the result as a draft to check, not a certified transcription." },
      { q: "Which languages does it read?", a: "English and Urdu. Each language is loaded the first time you use it, from this site, and then kept ready for the rest of your visit. Pick the one that matches your document before you run it." },
      { q: "Can it read a PDF?", a: "Yes. A PDF page is drawn to a picture first and then read, so a scanned PDF works. If the PDF already has selectable text, you can copy that directly in a reader without recognising it again." },
      { q: "Why is the first run slow?", a: "The recogniser and the language are downloaded once, which is a few megabytes, and then cached. After that, reading a page is quick, and none of it involves a server of ours." },
    ],
    multiple: false,
    accept: "image/jpeg,image/png,image/webp,application/pdf",
    render: "ocr",
  },
  {
    slug: "merge",
    category: "pages",
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
    category: "pages",
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
    category: "pages",
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
    category: "pages",
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
    slug: "delete-pages",
    category: "pages",
    title: "Delete pages",
    blurb: "Remove the pages you do not want and keep the rest",
    seoTitle: "Delete pages from a PDF, free, and never uploaded",
    description:
      "Pick the pages to remove and download what is left, in the original order. Runs entirely in your browser, so nothing is uploaded.",
    intro: [
      "Choose the pages you want gone and download the rest. The order of everything you keep stays exactly as it was.",
      "This is the same engine as extract, asked the other way round. Extract keeps what you pick; this removes it. Whichever way you think about the job, the result is identical.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Can I get the deleted pages back?", a: "Not from the new file, no. The pages are left out of it rather than hidden inside it, which is the point: a page you removed before sending a document on is genuinely not in what you send. Keep your original if you might need them." },
      { q: "What if I want to keep only a few pages?", a: "Use extract instead. It asks you to pick what stays rather than what goes, which is less counting when the pages you want are the smaller group." },
      { q: "Does it change the pages I keep?", a: "No. They are copied across as they are, with the same text, images and resolution. Nothing is re-encoded." },
      { q: "Can I delete every page?", a: "No, and the tool says so rather than handing you an empty file. A PDF has to have at least one page to be a PDF." },
      { q: "What about password-protected files?", a: "A file that needs a password to open cannot be read. Remove the password in your PDF reader first, then come back." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "page-numbers",
    category: "finish",
    title: "Add page numbers",
    blurb: "Stamp numbers onto the pages, in the corner you choose",
    seoTitle: "Add page numbers to a PDF, free, and never uploaded",
    description:
      "Stamp page numbers into a PDF, choosing the corner, the starting number and whether to show the total. Runs in your browser.",
    intro: [
      "Numbers are drawn into the file itself, so they are there in every reader and on paper, not only in a preview here.",
      "You can start the count at a number other than one, and leave a cover page bare. Both come up the moment a document is part of something larger.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Can I start at a number other than 1?", a: "Yes. Set the starting number and the count runs on from there. This is what you want when the document is chapter two of something, or continues from a file somebody else numbered." },
      { q: "Can I leave the cover page unnumbered?", a: "Yes. Tell it how many pages to skip at the front and those are left bare, with the count starting on the first page after them." },
      { q: "What if my pages are sideways?", a: "The numbers follow what you see rather than what the file says. A page scanned sideways carries a rotation, and the number is placed and turned to match, so it reads the right way up in the corner you picked." },
      { q: "Will the numbers cover up my text?", a: "They sit in the margin, about a centimetre from the two nearest edges. On a document with an unusually tight margin they can land close to the text, so check the result before you send it on." },
      { q: "Can I remove them later?", a: "Not with this tool. They are drawn into the page like any other text. Keep your original if you might want an unnumbered copy." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "watermark",
    category: "finish",
    title: "Watermark a PDF",
    blurb: "Draw text across every page, at the angle you choose",
    seoTitle: "Add a watermark to a PDF, free, and never uploaded",
    description:
      "Draw text across every page of a PDF, choosing the wording, the angle and how faint it is. Runs entirely in your browser.",
    intro: [
      "Type the wording, pick how it sits and how faint it is, and every page gets the same mark drawn into it.",
      "This is a visible mark rather than a lock. It is the right tool for making sure nobody signs the draft by mistake, and the wrong one for stopping somebody who does not want to be stopped.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Does a watermark protect my document?", a: "No, and it is worth being clear about that. Anyone with a PDF editor can take it off again. What it does is tell an honest reader what they are holding, which is why DRAFT and COPY are the words most people put there." },
      { q: "How faint should it be?", a: "Faint enough to read the page through, dark enough to notice. Around fifteen percent suits a diagonal mark across text. If you cannot see it in the result, raise it and run the file again." },
      { q: "Will it cover every page?", a: "Yes, every page in the file, including any that are sideways. There is no way to mark only some of them here; run the pages you want through separately and merge them back if you need that." },
      { q: "Can I use my logo instead of text?", a: "Not yet. This draws text only. An image watermark needs the picture embedded and positioned, which is a different tool rather than another setting." },
      { q: "Will it make the file much bigger?", a: "Barely. The text is drawn with one of the standard PDF faces every reader already has, so nothing is embedded and the file grows by a few hundred bytes a page." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "pdf-to-images",
    category: "convert",
    title: "PDF to images",
    blurb: "Turn every page into a JPG or PNG, in one zip",
    seoTitle: "PDF to JPG and PNG online, free, and never uploaded",
    description:
      "Turn every page of a PDF into a JPG or PNG and download them as one zip. The pages are drawn in your browser and never uploaded.",
    intro: [
      "Every page becomes its own picture, numbered in order, and they come back as a single zip file.",
      "The pages are drawn in the tab, the same way a reader draws them on screen, so what you get is what the document looks like rather than a copy of what is inside it.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "JPG or PNG?", a: "JPG for scans and anything photographic, because it is far smaller. PNG for pages that are mostly text, line drawings or screenshots, where it stays sharp and JPG leaves a faint mess around the edges of letters." },
      { q: "What resolution do I get?", a: "About twice the size the page is defined at, which is roughly 150 dots per inch and reads cleanly on a screen. Very large pages are capped, so a poster does not try to allocate more memory than the tab has." },
      { q: "How many pages can it do?", a: "Two hundred. Every picture has to be held in memory at once to build the zip, and past that a phone runs out and the browser closes the tab. Split the file first and run the parts if you have more." },
      { q: "Can I get one page instead of all of them?", a: "Extract that page first, then run it through here. The result is a zip with a single picture in it." },
      { q: "Is the text still selectable?", a: "No. A picture of a page is a picture. If you need the text, keep the PDF, or use extract to pull out the pages you want and leave them as a PDF." },
    ],
    multiple: false,
    accept: "application/pdf",
  },
  {
    slug: "images-to-pdf",
    category: "convert",
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
    category: "finish",
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
