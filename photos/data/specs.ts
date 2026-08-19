/**
 * Single source of truth for every photo spec the tool can produce.
 *
 * Rules for editing this file:
 *  - Never invent a head-height range. Leave `headMinMm`/`headMaxMm` undefined
 *    if the official source does not publish a number. The crop falls back to a
 *    generic framing and the UI says so out loud.
 *  - `pixelWidth`/`pixelHeight` are stored explicitly (not derived at runtime)
 *    so the exported file size is reviewable in a diff. `specs.test.ts` asserts
 *    they match `mmToPx(mm, dpi)`.
 *  - Anything not checked against the issuing authority's own page carries a
 *    `// TODO verify against official source` marker and conservative notes.
 */

export type BackgroundColor = "white" | "off-white" | "light-grey";

export type PhotoSpec = {
  slug: string;
  country: string;
  countryCode: string;
  document: string;
  widthMm: number;
  heightMm: number;
  dpi: number;
  pixelWidth: number;
  pixelHeight: number;
  /** Chin to crown, in millimetres. Undefined when no official range exists. */
  headMinMm?: number;
  headMaxMm?: number;
  /** Distance from the bottom edge of the photo to the eye line, in millimetres. */
  eyeLineFromBottomMm?: [number, number] | null;
  background: BackgroundColor;
  notes: string[];
  /** Set when any dimension in this entry still needs checking. */
  needsVerification?: boolean;
};

/** Millimetres to pixels at a given DPI, rounded to a whole pixel. */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export const BACKGROUND_HEX: Record<BackgroundColor, string> = {
  white: "#ffffff",
  "off-white": "#faf9f6",
  "light-grey": "#f0f0f0",
};

export const BACKGROUND_LABEL: Record<BackgroundColor, string> = {
  white: "Plain white",
  "off-white": "Plain off-white",
  "light-grey": "Plain light grey",
};

export const specs: PhotoSpec[] = [
  {
    slug: "us-passport",
    country: "United States",
    countryCode: "US",
    document: "Passport",
    // 2 x 2 inches exactly. Stored in mm so one code path handles every spec.
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    headMinMm: 25.4,
    headMaxMm: 34.9,
    eyeLineFromBottomMm: [28.6, 34.9],
    background: "white",
    notes: [
      "2 x 2 inches (51 x 51 mm), which is 600 x 600 pixels at 300 DPI.",
      "Head measured chin to crown must be between 1 and 1 3/8 inches (25 to 35 mm).",
      "Eyes must sit between 1 1/8 and 1 3/8 inches (28 to 35 mm) from the bottom edge.",
      "Plain white or off-white background, taken within the last 6 months.",
      "Neutral expression or a natural smile, both eyes open, no glasses.",
    ],
  },
  {
    slug: "us-visa",
    country: "United States",
    countryCode: "US",
    document: "Visa (DS-160)",
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    headMinMm: 25.4,
    headMaxMm: 34.9,
    eyeLineFromBottomMm: [28.6, 34.9],
    background: "white",
    notes: [
      "Same geometry as the US passport photo: 2 x 2 inches, 600 x 600 pixels.",
      "The DS-160 upload accepts square images from 600 x 600 up to 1200 x 1200 pixels.",
      "Keep the file under 240 KB when uploading to the DS-160 form.",
      "Plain white or off-white background, taken within the last 6 months.",
    ],
  },
  {
    slug: "uk-passport",
    country: "United Kingdom",
    countryCode: "GB",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    // 600 DPI, not 300: the digital application needs at least 600 x 750 px,
    // which a 35 x 45 mm photo at 300 DPI would not reach.
    dpi: 600,
    pixelWidth: 827,
    pixelHeight: 1063,
    headMinMm: 29,
    headMaxMm: 34,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    notes: [
      "35 x 45 mm printed. Digital uploads must be at least 600 x 750 pixels.",
      "Head measured chin to crown must be between 29 and 34 mm.",
      "Plain light grey or cream background, no pattern and no shadow behind you.",
      "No glasses at all, and nothing covering the face.",
      "Neutral expression with the mouth closed.",
    ],
  },
  {
    slug: "schengen-visa",
    country: "Schengen area",
    countryCode: "EU",
    document: "Visa",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified: France-Visas photograph instructions and the ICAO guidelines
    // published by the European Commission. 32-36 mm is the 70-80% rule
    // expressed in millimetres on a 45 mm frame.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    notes: [
      "35 x 45 mm, the ICAO size used across the Schengen area.",
      "The head measured chin to crown must be 32 to 36 mm, which is 70 to 80 percent of the height.",
      "Plain light grey background, evenly lit, with no pattern and no shadow.",
      "The rules come from the EU Visa Code and the ICAO standard, but individual consulates add their own guidance. Check the one you are applying to.",
    ],
  },
  {
    slug: "pakistan-passport",
    country: "Pakistan",
    countryCode: "PK",
    document: "Passport and NICOP",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified: DGI&P publishes 45 x 35 mm and "face takes up 70-80% of the
    // photograph". The millimetre range is that percentage on a 45 mm frame,
    // not a separately published figure.
    headMinMm: 31.5,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "45 mm high by 35 mm wide, on a plain white background.",
      "The face must fill 70 to 80 percent of the photo, which is 31.5 to 36 mm from chin to crown.",
      "Face the camera straight on, with both edges of your face showing and no shadow behind you.",
      "Head coverings worn for religious reasons are allowed, but the full face must be visible.",
      "Uploads to the online passport service are capped at 350 KB.",
    ],
  },
  {
    slug: "india-passport-us",
    country: "India",
    countryCode: "IN",
    document: "Passport (applications filed in the US)",
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    // Verified size only. VFS Global and the Indian consulates in the US state
    // 51 x 51 mm on a pure white background but publish no chin-to-crown range,
    // so none is claimed. 50.8 mm is two inches exactly, which lands on 600 px.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "51 x 51 mm, written as 2 x 2 inches, which is what the Indian consulates and VFS Global ask for in the United States.",
      "The background must be pure white, and the photo taken within the last 6 months.",
      "No chin-to-crown measurement is published for this format, so this tool frames the head using a general portrait ratio.",
      "This is not the size used for applications filed inside India.",
    ],
  },
  {
    slug: "india-passport",
    country: "India",
    countryCode: "IN",
    document: "Passport (applications filed in India)",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified size only: Passport Seva states 4.5 x 3.5 cm on white, and
    // publishes no chin-to-crown range.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "4.5 x 3.5 cm, meaning 45 mm high by 35 mm wide, on a white background.",
      "The photo must show the full head, from the top of the hair to the bottom of the chin, facing forward with the eyes open.",
      "No chin-to-crown measurement is published, so this tool uses a general portrait ratio.",
      "Applications filed in India usually have the photo captured at the Passport Seva Kendra instead.",
    ],
  },
  {
    slug: "canada-passport",
    country: "Canada",
    countryCode: "CA",
    document: "Passport",
    widthMm: 50,
    heightMm: 70,
    dpi: 300,
    pixelWidth: 591,
    pixelHeight: 827,
    headMinMm: 31,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "50 x 70 mm, the largest of the common passport sizes.",
      "The face from chin to crown must measure between 31 and 36 mm.",
      "Plain white or light coloured background with no shadow.",
      "Printed Canadian passport photos must carry the studio name and date on the back, which this tool cannot add.",
    ],
  },
  {
    slug: "australia-passport",
    country: "Australia",
    countryCode: "AU",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified against the Australian Passport Office photo guidelines.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    notes: [
      "35 x 45 mm, with the head measuring 32 to 36 mm from chin to crown.",
      "Plain light coloured background, not pure white and not patterned.",
      "Neutral expression, eyes open, facing the camera straight on, and nobody else in the photo.",
      "Nothing on the head or face, apart from a head covering worn for religious reasons.",
    ],
  },
  {
    slug: "uae-visa",
    country: "United Arab Emirates",
    countryCode: "AE",
    document: "Visa",
    // Corrected from 43 x 55 mm. The ICP publishes 4.5 x 3.5 cm, matching the
    // ICAO size; 43 x 55 is widely repeated online but appears on no ICP page.
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // ICP states the face should fill 60-70% in one document and cites the
    // ICAO standard (70-80%) in another. With the two disagreeing, no range is
    // claimed here.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "4.5 x 3.5 cm, meaning 45 mm high by 35 mm wide, on a plain white background, following the ICAO standard.",
      "You will often see 43 x 55 mm quoted for UAE visas. That size does not appear in the ICP's own photo specification, so this tool uses the published one.",
      "The ICP does not state a single chin-to-crown range, so this tool uses a general portrait ratio.",
      "Eyes open, no frame around the photo, and hands out of shot above shoulder level.",
    ],
  },
  {
    slug: "saudi-visa",
    country: "Saudi Arabia",
    countryCode: "SA",
    document: "Visa",
    // Corrected from 2 x 2 inches. The Ministry of Foreign Affairs publishes
    // 4 x 6 cm for visa applications submitted through Enjaz.
    widthMm: 40,
    heightMm: 60,
    dpi: 300,
    pixelWidth: 472,
    pixelHeight: 709,
    // Derived from the published "face must present 60% to 70% of the photo"
    // on a 60 mm frame, not a separately published millimetre range.
    headMinMm: 36,
    headMaxMm: 42,
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "4 x 6 cm, meaning 40 mm wide by 60 mm high, on a white background, with no exceptions on the background.",
      "The face must fill 60 to 70 percent of the photo, which is 36 to 42 mm from chin to crown.",
      "Taken within the last 6 months, facing the camera directly.",
      "You will often see 2 x 2 inches quoted for Saudi visas. The Ministry of Foreign Affairs publishes 4 x 6 cm, which is what this tool produces.",
      "The application itself is filed through Enjaz, which prints the photo onto the form.",
    ],
  },
  {
    slug: "china-visa",
    country: "China",
    countryCode: "CN",
    document: "Visa",
    widthMm: 33,
    heightMm: 48,
    dpi: 300,
    pixelWidth: 390,
    pixelHeight: 567,
    // Verified against the Chinese Visa Application Service Centre's published
    // photo requirements.
    headMinMm: 28,
    headMaxMm: 33,
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "33 x 48 mm, a narrower frame than the usual 35 x 45 mm.",
      "The head must measure 28 to 33 mm from chin to crown, and 15 to 22 mm across.",
      "Plain white background, taken within the last 6 months.",
      "Neutral expression, eyes open, lips closed, ears visible.",
      "The head may not be tilted more than 20 degrees left or right, or 25 degrees up or down.",
    ],
  },
  {
    slug: "japan-passport",
    country: "Japan",
    countryCode: "JP",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified against the Ministry of Foreign Affairs photo specification,
    // which states the face as 34 mm plus or minus 2.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "35 x 45 mm, with the head measuring 34 mm from chin to crown, give or take 2 mm.",
      "The gap above the head must be 4 mm, give or take 2, and the chin sits 7 mm from the bottom edge, give or take 2.",
      "Plain background with a clear edge between your hair and the background.",
      "Taken within the last 6 months, facing the camera straight on.",
    ],
  },
  {
    slug: "bangladesh-passport",
    country: "Bangladesh",
    countryCode: "BD",
    document: "Passport",
    // The 55 x 45 figure that circulates online is the same photo described
    // height-first. The frame is portrait: 45 mm wide, 55 mm tall.
    widthMm: 45,
    heightMm: 55,
    dpi: 300,
    pixelWidth: 531,
    pixelHeight: 650,
    // TODO verify against official source — the Department of Immigration and
    // Passports publishes no photo specification that could be found. Every
    // source quoting 45 x 55 mm is a third-party photo tool citing other photo
    // tools, which is not evidence.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "45 mm wide by 55 mm tall, in portrait orientation.",
      "You will see this size written as 55 x 45 mm. That is the same photo with the height quoted first, not a landscape frame.",
      "This size could not be confirmed on a Bangladeshi government page, so treat it as a starting point and check the instructions you were given.",
      "For an e-passport, your photo is captured at the enrolment centre. A printed photo is generally only needed for paperwork and for applications made at a mission abroad.",
      "Plain white background. No chin-to-crown range is published.",
    ],
    needsVerification: true,
  },
  {
    slug: "nigeria-passport",
    country: "Nigeria",
    countryCode: "NG",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // TODO verify against official source — the Nigeria Immigration Service has
    // an image-compliance page but it could not be read, and no size is stated
    // anywhere else on their site.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "35 x 45 mm on a plain white background.",
      "The Nigeria Immigration Service does not publish this size in a form that could be checked, so treat it as a starting point.",
      "Your photograph is captured at the passport enrolment centre. A printed photo is mainly needed for supporting paperwork.",
      "No chin-to-crown range is published, so this tool uses a general portrait ratio.",
    ],
    needsVerification: true,
  },
  {
    slug: "philippines-passport",
    country: "Philippines",
    countryCode: "PH",
    document: "Passport",
    // Corrected from 35 x 45 mm. The DFA and its posts abroad ask for 2 x 2.
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    // No chin-to-crown range is published.
    eyeLineFromBottomMm: null,
    background: "white",
    notes: [
      "2 x 2 inches on a plain white background, which is what the DFA and the Philippine posts abroad ask for.",
      "No eyeglasses.",
      "If you are applying in the Philippines, your photo is taken at the DFA appointment. This size is for applications at a consulate abroad and for supporting paperwork.",
      "No chin-to-crown range is published, so this tool uses a general portrait ratio.",
    ],
  },
];

export const DEFAULT_SPEC_SLUG = "us-passport";

const bySlug = new Map(specs.map((s) => [s.slug, s]));

export function getSpec(slug: string): PhotoSpec | undefined {
  return bySlug.get(slug);
}

export function getSpecOrDefault(slug?: string | null): PhotoSpec {
  return (slug && bySlug.get(slug)) || bySlug.get(DEFAULT_SPEC_SLUG)!;
}

/**
 * "United States passport" — used in headings and page titles.
 *
 * Only the first letter is lowered. Blanket lowercasing would turn "Visa
 * (DS-160)" into "ds-160" and "Passport and NICOP" into "nicop".
 */
export function specTitle(spec: PhotoSpec): string {
  const document = spec.document.charAt(0).toLowerCase() + spec.document.slice(1);
  return `${spec.country} ${document}`;
}

/** "35 x 45 mm" or "2 x 2 in" where the spec is defined in inches. */
export function specSizeLabel(spec: PhotoSpec): string {
  const isInch = Math.abs(spec.widthMm / 25.4 - Math.round(spec.widthMm / 25.4)) < 0.01;
  if (isInch && Math.abs(spec.heightMm / 25.4 - Math.round(spec.heightMm / 25.4)) < 0.01) {
    return `${Math.round(spec.widthMm / 25.4)} x ${Math.round(spec.heightMm / 25.4)} in`;
  }
  return `${trim(spec.widthMm)} x ${trim(spec.heightMm)} mm`;
}

function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
