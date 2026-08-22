/**
 * The seven tools. One entry per route, and the single source for the landing
 * tiles, the routes themselves, their sitemap entries and their SEO pages.
 * Adding a tool is one entry here.
 */

export type ToolSlug =
  | "resize"
  | "convert"
  | "crop"
  | "compress"
  | "flip-rotate"
  | "favicon"
  | "strip-exif";

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
    slug: "crop",
    title: "Crop an image",
    blurb: "Trim to a box, freehand or to a ratio",
    seoTitle: "Crop an image online, free, and never uploaded",
    description:
      "Crop a photo by dragging a box, or lock it to a ratio like square or 16:9. Runs in your browser; nothing is uploaded.",
    intro: [
      "Drag a box over the part you want and download that alone. Lock it to a ratio first if the result has to be a shape, like a square for a profile picture.",
      "The crop is exact to the pixel, and the readout shows the size you will get before you take it.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "Can I crop to a square, or to 16:9?", a: "Yes. Pick a ratio and the box keeps that shape while you drag and move it. Freeform lets the box be any shape at all." },
      { q: "I need a passport-sized crop.", a: "This crops to ordinary picture ratios. For an ID or visa photo, which has rules about head size and position that a plain crop cannot meet, use EveryKit ID Photos instead. There is a link at the top of the kit list." },
      { q: "Does it lose quality?", a: "Cropping itself removes only the pixels outside the box; the rest is untouched. Saving as JPG or WebP compresses the result on the way out, and the quality slider controls that. Saving as PNG does not." },
      { q: "What formats can I crop?", a: "JPG, PNG and WebP. A cropped PNG keeps its transparency." },
    ],
  },
  {
    slug: "compress",
    title: "Compress an image",
    blurb: "Shrink the file, to a size if you need one",
    seoTitle: "Compress an image online to a target size, free, and never uploaded",
    description:
      "Make an image file smaller with a quality slider, or aim at a target size and let the tool find the quality. Runs in your browser.",
    intro: [
      "Move the slider and watch the file size change, or type a size to aim for and the tool searches for the quality that lands under it.",
      "It compresses honestly. A photo shrinks a lot; a screenshot saved as PNG barely moves, and the tool says so rather than pretending.",
    ],
    faq: [
      UPLOAD_ANSWER,
      BATCH_ANSWER,
      { q: "How does the target size work?", a: "You give it a ceiling, say 500 kB, and it tries quality settings until it finds the highest one that still comes in under your number. It is best-effort: if even the lowest quality is still too big, it hands you that smallest version and tells you it could not reach the target." },
      { q: "Why does my PNG barely get smaller?", a: "PNG is lossless, so there is no quality to trade away, and a photograph stored as PNG is already about as small as PNG can make it. To compress a photo meaningfully, convert it to JPG or WebP first, which is a different tool here." },
      { q: "JPG or WebP for the smallest file?", a: "WebP, usually by a clear margin at the same visible quality, and every current browser displays it. JPG is the safer choice if the file has to open in something old." },
      { q: "Will it enlarge the image?", a: "No. Compressing changes how the picture is stored, not how big it is in pixels. Use resize for the dimensions." },
    ],
  },
  {
    slug: "flip-rotate",
    title: "Flip and rotate",
    blurb: "Turn in quarter steps, or mirror",
    seoTitle: "Rotate and flip an image online, free, and never uploaded",
    description:
      "Rotate a photo in 90-degree steps or mirror it, in your browser. Reads the camera orientation first so it starts the right way up.",
    intro: [
      "Turn the picture a quarter at a time, or flip it left-to-right or top-to-bottom. What you see is what you download.",
      "A phone photo often carries an orientation tag that says which way up it should be. This reads that first and bakes it in, so the file is upright everywhere rather than relying on the viewer to honour a tag.",
    ],
    faq: [
      UPLOAD_ANSWER,
      BATCH_ANSWER,
      { q: "My photo looks sideways everywhere but on my phone. Why?", a: "The camera stored it in its original orientation and added a tag saying to turn it. Some apps honour that tag and some ignore it, which is why the same file looks right in one place and wrong in another. This tool reads the tag, turns the picture for real, and writes it out with no tag, so it looks the same everywhere." },
      { q: "Does turning it lose quality?", a: "A 90-degree turn or a mirror is lossless in principle, but the file is re-encoded on the way out, so a JPG is compressed again. The quality slider controls that. Save as PNG to avoid it entirely." },
      { q: "Can I straighten a photo by a few degrees?", a: "Not here. This does quarter turns and mirrors, which is what fixes a sideways phone photo. A small tilt correction needs cropping the corners off, which is a different job." },
      { q: "What formats does it read?", a: "JPG, PNG and WebP. Orientation tags come from cameras and so turn up in JPGs; the others are shown as they are." },
    ],
  },
  {
    slug: "favicon",
    title: "Make a favicon",
    blurb: "One image in, every icon size out",
    seoTitle: "Favicon generator online, free, and never uploaded",
    description:
      "Turn one square image into a set of favicon PNGs and a real multi-size .ico file, zipped, in your browser. Nothing is uploaded.",
    intro: [
      "Drop in a square image and get back the icon sizes a site needs: PNGs for modern browsers and phones, and a genuine multi-size favicon.ico for the address bar and older ones.",
      "Everything is built on your device and comes back as one ZIP, with a line of HTML to paste into your page's head.",
    ],
    faq: [
      UPLOAD_ANSWER,
      { q: "What is in the ZIP?", a: "PNG icons at 16, 32, 48, 180 and 512 pixels, and a favicon.ico holding the 16, 32 and 48 sizes in one file. The 180 is for an iPhone home screen, the 512 for an Android install, and the rest for the browser tab." },
      { q: "Is the .ico a real ICO file?", a: "Yes. It is a proper multi-image ICO with the 16, 32 and 48 pixel versions inside, built byte by byte here, not a PNG renamed. That is what the address bar and older browsers expect." },
      { q: "Does my image need to be square?", a: "It should be. A favicon is shown in a square, so a rectangular image is padded to a square first, which leaves bars down the sides. Crop it square before you start for the best result." },
      { q: "What do I do with the files?", a: "Put them in your site and paste the snippet from the result into your page's head. The snippet lists each size with the right link tag." },
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
