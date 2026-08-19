/**
 * The three tools. One entry per route, and the single source for the landing
 * tiles, the routes themselves and their SEO pages.
 */

export type ToolSlug = "resize" | "convert" | "strip-exif";

export type Faq = { q: string; a: string };

export type Tool = {
  slug: ToolSlug;
  title: string;
  blurb: string;
  seoTitle: string;
  description: string;
  intro: string[];
  faq: Faq[];
};

/** First on every page, because it is the question and the reason this exists. */
const UPLOAD_ANSWER: Faq = {
  q: "Are my photos uploaded?",
  a: "No. Each file is read from your disk, worked on inside the browser tab, and saved back to your disk. Nothing is sent to us or anyone else, and there is no server here that could receive a photo. Open your browser's network tab and run a batch: no request carries an image.",
};

const BATCH_ANSWER: Faq = {
  q: "Can I do a whole folder at once?",
  a: "Yes. Drop in as many as you like and they are handled one after another, with the finished set offered as a single ZIP. They go one at a time on purpose, because decoding twenty large photos simultaneously is how a phone browser runs out of memory and kills the tab.",
};

export const tools: Tool[] = [
  {
    slug: "resize",
    title: "Resize images",
    blurb: "Make photos smaller, in a batch",
    seoTitle: "Resize images online in a batch, free, and never uploaded",
    description:
      "Resize one photo or a whole batch, by width, height, or to fit a box. Runs in your browser; nothing is uploaded.",
    intro: [
      "Set a width, a height, or both, and every photo you drop in is resized to match. The finished set comes back as a ZIP.",
      "Photos smaller than the size you ask for are left alone rather than enlarged, because enlarging invents detail that was never in the picture. You can turn that off if you actually want it.",
    ],
    faq: [
      UPLOAD_ANSWER,
      BATCH_ANSWER,
      { q: "What is the difference between fit, fill and exact?", a: "Fit puts the whole image inside the box, so nothing is lost but the result may not fill it. Fill covers the box completely and crops what hangs over the edges, taken from the centre. Exact stretches to the numbers you gave regardless of proportions, which distorts the picture. It is there because sometimes that is genuinely what is needed." },
      { q: "Why did nothing happen to some of my photos?", a: "They were already smaller than the size you asked for. Each result says so rather than quietly leaving them out." },
      { q: "Will resizing lose quality?", a: "Making an image smaller always discards detail, which is what smaller means, and saving as JPEG or WebP compresses it again on the way out. The quality slider controls how much. Making an image larger cannot add detail back, only guess at it." },
    ],
  },
  {
    slug: "convert",
    title: "Convert format",
    blurb: "Between JPG, PNG and WebP",
    seoTitle: "Convert images between JPG, PNG and WebP, free, and never uploaded",
    description:
      "Convert photos between JPG, PNG and WebP in your browser, one or a batch at a time. Nothing is uploaded.",
    intro: [
      "Pick a format and everything you drop in is converted, with the before and after sizes shown for each one.",
      "The result is whatever the conversion honestly produces. A photo saved as PNG usually comes out larger, not smaller, and the sizes will say so.",
    ],
    faq: [
      UPLOAD_ANSWER,
      BATCH_ANSWER,
      { q: "Which format should I pick?", a: "JPG for photographs, which is what nearly everything accepts. PNG for screenshots, logos and anything needing a transparent background. WebP when you control where it is displayed and want the smallest file. It is smaller than JPG at the same quality, and every current browser reads it." },
      { q: "Why did my file get bigger?", a: "Almost certainly because you converted a photograph to PNG. PNG is lossless, so it stores a photograph faithfully and at length; JPG throws away detail you cannot easily see, which is why it is smaller. Neither is broken. They are for different jobs." },
      { q: "What happens to a transparent background saved as JPG?", a: "JPG cannot store transparency, so transparent areas are filled with white. If that matters, convert to PNG or WebP instead, both of which keep it." },
      { q: "Does converting remove the EXIF data?", a: "Yes, as a side effect. The picture is decoded and re-encoded, and the metadata does not survive that. If removing metadata is the actual goal, use the strip tool instead: it removes it without touching the image at all." },
    ],
  },
  {
    slug: "strip-exif",
    title: "Remove EXIF",
    blurb: "Strip location and camera data, losslessly",
    seoTitle: "Remove EXIF data from photos without re-compressing them",
    description:
      "Strip GPS location, camera details and timestamps out of JPEGs without re-compressing the image. Runs in your browser.",
    intro: [
      "A photo from a phone usually carries where it was taken, when, and on what. This removes that.",
      "It does it without re-encoding the picture. The metadata segments are dropped and everything else is copied through byte for byte, so the image data in the file you get back is identical to the one you put in. It is not re-saved, not softened, and not a fraction larger.",
    ],
    faq: [
      UPLOAD_ANSWER,
      BATCH_ANSWER,
      { q: "What exactly is removed?", a: "The EXIF block, which is where GPS coordinates, the camera model and serial number, and the date and time live; XMP, which carries editing history; and any embedded comment. The JFIF block is kept, because it holds the image's density and dropping it changes how some software reads its physical size." },
      { q: "How is this different from re-saving the photo?", a: "Re-saving through a canvas is the usual approach, and it does remove the metadata, by decoding the picture and compressing it again from scratch. The result is a different, softer, often larger file. This tool never decodes the image: it removes the metadata segments and copies the rest through unchanged, which is checked in the tests by comparing the image data of the original and the result byte for byte." },
      { q: "Does it work on PNG and WebP?", a: "Not yet. This handles JPEG, which is what phone cameras produce and where EXIF actually turns up. Anything else is handed back untouched and told you so, rather than being quietly converted." },
      { q: "Is the location really gone?", a: "The EXIF block that holds it is gone from the file, and you can confirm it with any metadata viewer. Worth knowing separately: a copy you have already shared, backed up or uploaded still has it. This changes the file you have, not the ones already elsewhere." },
    ],
  },
];

const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return bySlug.get(slug as ToolSlug);
}
