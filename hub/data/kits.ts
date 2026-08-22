/**
 * The kit registry. Single source of truth for both the directory on `/` and
 * the JSON served at `/kits.json`, so the page and the file every kit reads can
 * never disagree.
 *
 * Adding a kit means adding an entry here and nothing else.
 */

export type KitStatus = "live" | "soon";

/**
 * Which shelf a kit sits on in the directory. Additive: the kits' cross-promo
 * strips parse this same file and ignore fields they do not know about, so new
 * ones may be added but existing names and shapes never change.
 */
export type KitCategory = "photos" | "documents" | "everyday" | "developers";

export type Kit = {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  status: KitStatus;
  category: KitCategory;
  /** A glyph this app serves, referenced by the registry so kits can use it too. */
  icon: string;
  /**
   * What the kit hands back, described for the thumbnail's alt text. Kept
   * beside the kit so the directory does not need a lookup table.
   */
  outputAlt: string;
};

export type KitTool = {
  name: string;
  path: string;
  synonyms: string[];
};

/**
 * Every tool on the platform, by kit slug.
 *
 * The hub cannot import a kit's own data across projects, so the catalogue is
 * declared here. It is the backbone the hub search and the "all tools" listing
 * both read, and it travels in kits.json for the cross-promo strips. The two
 * launcher kits with programmatic sub-pages, Photos and Letters, are each one
 * entry with broad synonyms rather than a row per country or per letter.
 */
export const kitTools: Record<string, KitTool[]> = {
  photos: [
    { name: "Passport & visa photo", path: "/", synonyms: ["passport", "visa", "id photo", "biometric", "2x2", "35x45", "headshot"] },
  ],
  letters: [
    { name: "Formal letter generator", path: "/", synonyms: ["letter", "resignation", "complaint", "refund", "visa invitation", "sponsorship", "notice to vacate", "experience certificate", "salary certificate", "internship", "character reference", "bank account closure", "cover letter", "noc"] },
  ],
  pdf: [
    { name: "Merge PDFs", path: "/merge", synonyms: ["combine", "join", "join pdf"] },
    { name: "Split a PDF", path: "/split", synonyms: ["divide", "separate"] },
    { name: "Extract pages", path: "/extract", synonyms: ["pull pages", "take pages"] },
    { name: "Organise pages", path: "/organize", synonyms: ["reorder", "rotate", "rearrange"] },
    { name: "Delete pages", path: "/delete-pages", synonyms: ["remove pages"] },
    { name: "Add page numbers", path: "/page-numbers", synonyms: ["number pages", "pagination"] },
    { name: "Watermark a PDF", path: "/watermark", synonyms: ["stamp", "draft mark"] },
    { name: "PDF to images", path: "/pdf-to-images", synonyms: ["pdf to jpg", "pdf to png", "convert pdf to image"] },
    { name: "Images to PDF", path: "/images-to-pdf", synonyms: ["jpg to pdf", "png to pdf", "photos to pdf"] },
    { name: "Compress a PDF", path: "/compress", synonyms: ["shrink", "reduce size", "smaller pdf"] },
  ],
  qr: [
    { name: "Link QR code", path: "/url", synonyms: ["url", "website qr"] },
    { name: "Text QR code", path: "/text", synonyms: ["plain text qr"] },
    { name: "Wi-Fi QR code", path: "/wifi", synonyms: ["wifi", "network", "password qr"] },
    { name: "Email QR code", path: "/email", synonyms: ["mailto qr"] },
    { name: "SMS QR code", path: "/sms", synonyms: ["text message qr"] },
    { name: "Calendar event QR code", path: "/event", synonyms: ["ics qr", "add to calendar"] },
    { name: "Contact card QR code", path: "/vcard", synonyms: ["vcard", "business card qr"] },
    { name: "WhatsApp QR code", path: "/whatsapp", synonyms: ["wa.me qr", "chat qr"] },
  ],
  images: [
    { name: "Resize images", path: "/resize", synonyms: ["scale", "shrink image", "dimensions"] },
    { name: "Convert format", path: "/convert", synonyms: ["jpg to png", "png to webp", "heic"] },
    { name: "Crop an image", path: "/crop", synonyms: ["trim", "square crop", "aspect ratio"] },
    { name: "Compress an image", path: "/compress", synonyms: ["reduce image size", "target size", "smaller photo"] },
    { name: "Flip and rotate", path: "/flip-rotate", synonyms: ["mirror", "turn", "rotate photo", "sideways"] },
    { name: "Make a favicon", path: "/favicon", synonyms: ["favicon", "site icon", "ico"] },
    { name: "Remove EXIF", path: "/strip-exif", synonyms: ["strip metadata", "remove gps", "location"] },
  ],
  background: [
    { name: "Remove the background", path: "/", synonyms: ["background remover", "cut out", "transparent"] },
    { name: "Transparent background", path: "/transparent-background", synonyms: ["png transparent", "remove background"] },
    { name: "White background", path: "/white-background", synonyms: ["white bg", "product photo"] },
  ],
  text: [
    { name: "Word counter", path: "/word-counter", synonyms: ["character count", "count words", "reading time"] },
    { name: "Case converter", path: "/case-converter", synonyms: ["uppercase", "lowercase", "title case", "sentence case"] },
    { name: "Clean text", path: "/clean-text", synonyms: ["remove line breaks", "tidy", "whitespace"] },
    { name: "Find and replace", path: "/find-replace", synonyms: ["search replace", "regex replace"] },
    { name: "Remove duplicate lines", path: "/remove-duplicate-lines", synonyms: ["dedupe", "unique lines"] },
    { name: "Sort lines", path: "/sort-lines", synonyms: ["alphabetise", "order lines", "shuffle"] },
    { name: "Lorem ipsum", path: "/lorem-ipsum", synonyms: ["placeholder text", "dummy text", "filler"] },
  ],
  sign: [
    { name: "Draw your signature", path: "/", synonyms: ["signature", "sign", "handwritten"] },
    { name: "Type your signature", path: "/type", synonyms: ["typed signature", "font signature"] },
    { name: "Sign a PDF", path: "/sign-pdf", synonyms: ["e-sign", "add signature to pdf"] },
  ],
  invoice: [
    { name: "Invoice maker", path: "/", synonyms: ["invoice", "bill", "pdf invoice"] },
    { name: "Quote maker", path: "/quote", synonyms: ["quote", "estimate"] },
    { name: "Receipt maker", path: "/receipt", synonyms: ["receipt", "paid receipt"] },
  ],
  ringtone: [
    { name: "Make a ringtone", path: "/", synonyms: ["ringtone", "cut audio", "trim mp3", "fade"] },
    { name: "Convert audio to MP3", path: "/convert", synonyms: ["wav to mp3", "m4a to mp3", "ogg to mp3"] },
    { name: "Change the volume", path: "/volume", synonyms: ["louder", "quieter", "gain", "normalise"] },
  ],
  dev: [
    { name: "JSON formatter", path: "/json", synonyms: ["format json", "validate json", "pretty print"] },
    { name: "Base64 encode and decode", path: "/base64", synonyms: ["base64", "encode", "decode"] },
    { name: "URL encode and decode", path: "/url", synonyms: ["percent encode", "escape url"] },
    { name: "UUID generator", path: "/uuid", synonyms: ["uuid", "guid", "unique id"] },
    { name: "Hash generator", path: "/hash", synonyms: ["md5", "sha256", "checksum"] },
    { name: "JWT decoder", path: "/jwt", synonyms: ["json web token", "decode jwt"] },
    { name: "Regex tester", path: "/regex", synonyms: ["regular expression", "test regex"] },
    { name: "Text diff", path: "/diff", synonyms: ["compare", "difference", "changes"] },
    { name: "Timestamp converter", path: "/timestamp", synonyms: ["unix time", "epoch"] },
    { name: "Cron parser", path: "/cron", synonyms: ["crontab", "schedule", "cron expression"] },
    { name: "Colour converter", path: "/color", synonyms: ["hex rgb hsl", "contrast checker", "wcag"] },
    { name: "Markdown preview", path: "/markdown", synonyms: ["md to html", "render markdown"] },
    { name: "JSON to CSV", path: "/json-to-csv", synonyms: ["json csv", "convert json"] },
  ],
  study: [
    { name: "GPA calculator", path: "/gpa", synonyms: ["grade point average", "gpa"] },
    { name: "Final grade calculator", path: "/final-grade", synonyms: ["what do i need", "exam grade"] },
    { name: "Citation generator", path: "/citation", synonyms: ["apa", "mla", "reference", "bibliography"] },
    { name: "Reading time", path: "/reading-time", synonyms: ["how long to read", "words per minute"] },
    { name: "Study timer", path: "/timer", synonyms: ["pomodoro", "countdown timer"] },
    { name: "Exam countdown", path: "/exam-countdown", synonyms: ["days until exam", "countdown"] },
  ],
  calc: [
    { name: "Age calculator", path: "/age", synonyms: ["how old", "date of birth"] },
    { name: "Date difference", path: "/date-difference", synonyms: ["days between", "date calculator"] },
    { name: "Unit converter", path: "/units", synonyms: ["metric imperial", "convert units", "temperature"] },
    { name: "Loan and EMI", path: "/emi", synonyms: ["loan", "instalment", "repayment"] },
    { name: "Percentage calculator", path: "/percentage", synonyms: ["percent", "percentage change"] },
    { name: "Discount calculator", path: "/discount", synonyms: ["sale price", "percent off", "saving"] },
    { name: "VAT and GST", path: "/vat", synonyms: ["vat", "gst", "sales tax", "add tax"] },
    { name: "Trip fuel cost", path: "/trip-cost", synonyms: ["fuel cost", "petrol", "mileage", "split cost"] },
  ],
};

export type CatalogEntry = {
  kitSlug: string;
  kitName: string;
  category: KitCategory;
  tool: KitTool;
  href: string;
};

/** Every tool, flattened, with an absolute link. The hub search reads this. */
export function catalog(): CatalogEntry[] {
  const entries: CatalogEntry[] = [];
  for (const kit of kits) {
    if (kit.status !== "live") continue;
    const tools = kitTools[kit.slug] ?? [];
    const base = kit.url.replace(/\/$/, "");
    for (const tool of tools) {
      const href = tool.path === "/" ? base : `${base}${tool.path}`;
      entries.push({ kitSlug: kit.slug, kitName: kit.name, category: kit.category, tool, href });
    }
  }
  return entries;
}

export const kits: Kit[] = [
  {
    slug: "photos",
    name: "EveryKit ID Photos",
    tagline: "Passport & visa photos from a selfie",
    url: "https://photos.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/photos.svg",
    outputAlt:
      "A square passport photo with guide lines marking where the top of the head and the chin must fall",
  },
  {
    slug: "letters",
    name: "EveryKit Letters",
    tagline: "Formal letters, written for you",
    url: "https://letters.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/letters.svg",
    outputAlt: "A page of a formal letter",
  },
  {
    slug: "pdf",
    name: "EveryKit PDF",
    tagline: "Merge, split and shrink PDFs",
    url: "https://pdf.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/pdf.svg",
    outputAlt: "Two pages being combined into a single document",
  },
  {
    slug: "qr",
    name: "EveryKit QR",
    tagline: "QR codes that never expire",
    url: "https://qr.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/qr.svg",
    outputAlt: "A QR code, with the three squares a scanner looks for at its corners",
  },
  {
    slug: "images",
    name: "EveryKit Images",
    tagline: "Resize, convert and clean up photos",
    url: "https://images.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/images.svg",
    outputAlt: "A large photo being reduced to a smaller one",
  },
  {
    slug: "background",
    name: "EveryKit Background",
    tagline: "Remove backgrounds in your browser, nothing uploaded",
    url: "https://background.useeverykit.com",
    status: "live",
    category: "photos",
    icon: "/icons/background.svg",
    outputAlt: "A person cut out from their background, on a chequerboard",
  },
  {
    slug: "text",
    name: "EveryKit Text",
    tagline: "Count, convert and clean text in a click",
    url: "https://text.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/text.svg",
    outputAlt: "Lines of text with a count beside them",
  },
  {
    slug: "sign",
    name: "EveryKit Sign",
    tagline: "Draw your signature, sign a PDF, done",
    url: "https://sign.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/sign.svg",
    outputAlt: "A signature written across a document",
  },
  {
    slug: "invoice",
    name: "EveryKit Invoice",
    tagline: "A clean PDF invoice in two minutes",
    url: "https://invoice.useeverykit.com",
    status: "live",
    category: "documents",
    icon: "/icons/invoice.svg",
    outputAlt: "An invoice with a totals block",
  },
  {
    slug: "ringtone",
    name: "EveryKit Ringtone",
    tagline: "Trim any song into a ringtone",
    url: "https://ringtone.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/ringtone.svg",
    outputAlt: "A waveform with a short span of it marked as the part that is kept",
  },
  {
    slug: "dev",
    name: "EveryKit Dev",
    tagline: "Small developer tools, nothing leaves your browser",
    url: "https://dev.useeverykit.com",
    status: "live",
    category: "developers",
    icon: "/icons/dev.svg",
    outputAlt: "Ten small tool squares laid out like a launcher",
  },
  {
    slug: "study",
    name: "EveryKit Study",
    tagline: "Calculators and helpers for students",
    url: "https://study.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/study.svg",
    outputAlt: "A graduation cap above a row of calculator keys",
  },
  {
    slug: "calc",
    name: "EveryKit Calc",
    tagline: "Everyday calculators that just answer",
    url: "https://calc.useeverykit.com",
    status: "live",
    category: "everyday",
    icon: "/icons/calc.svg",
    outputAlt: "A calculator with an answer on its display",
  },
];

/** Exactly the shape published at /kits.json, per the shared registry schema. */
export function registryPayload(): {
  kits: Array<Omit<Kit, "outputAlt">>;
} {
  return {
    kits: kits.map(({ slug, name, tagline, url, status, category, icon }) => ({
      slug,
      name,
      tagline,
      url,
      status,
      // Additive. Existing consumers read the first five and ignore these.
      category,
      icon,
      // The kit's tools, so a cross-promo strip can deep-link into them.
      tools: kitTools[slug] ?? [],
    })),
  };
}

export const CATEGORIES: Array<{ id: KitCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos & ID" },
  { id: "documents", label: "Documents & letters" },
  { id: "everyday", label: "Everyday" },
  { id: "developers", label: "For developers" },
];
