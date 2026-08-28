/**
 * Single source of truth for every photo spec the tool can produce.
 *
 * Rules for editing this file, and they are not optional:
 *  - Every spec carries a `source`: the official authority whose published
 *    requirement its dimensions were checked against. A wrong number gets a real
 *    person's application rejected, so a spec with no verifiable source is not
 *    added; it is left out and recorded as skipped instead.
 *  - Never invent a head-height range. Leave `headMinMm`/`headMaxMm` undefined
 *    if the official source does not publish a number. The crop falls back to a
 *    generic framing and the UI says so out loud.
 *  - `pixelWidth`/`pixelHeight` are stored explicitly (not derived at runtime)
 *    so the exported file size is reviewable in a diff. `specs.test.ts` asserts
 *    they match `mmToPx(mm, dpi)`.
 *  - The two entries that predate this rule and could not be confirmed against an
 *    issuing authority carry `needsVerification: true` and say so in their notes.
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
  /** The issuing authority whose published spec these dimensions were checked against. */
  source: string;
  notes: string[];
  /** Set when a dimension in this entry could not be confirmed against the authority. */
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
    source: "U.S. Department of State, travel.state.gov photo requirements",
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
    source: "U.S. Department of State, travel.state.gov / DS-160 photo requirements",
    notes: [
      "Same geometry as the US passport photo: 2 x 2 inches, 600 x 600 pixels.",
      "The DS-160 upload accepts square images from 600 x 600 up to 1200 x 1200 pixels.",
      "Keep the file under 240 KB when uploading to the DS-160 form.",
      "Plain white or off-white background, taken within the last 6 months.",
    ],
  },
  {
    slug: "us-green-card",
    country: "United States",
    countryCode: "US",
    document: "Green card and DV lottery",
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    // The DV instructions give the head as 50 to 69 percent of the image height.
    // On a 51 mm (600 px) square that is 25.4 to 35.1 mm, which matches the
    // passport range, so the same numbers are used.
    headMinMm: 25.4,
    headMaxMm: 34.9,
    eyeLineFromBottomMm: null,
    background: "white",
    source: "U.S. Department of State, travel.state.gov DV program / Green Card photo requirements",
    notes: [
      "Square, at least 600 x 600 pixels and at most 1200 x 1200, which is 2 x 2 inches at 300 DPI.",
      "The head from chin to crown must be 50 to 69 percent of the image height, and the eyes 56 to 69 percent up from the bottom.",
      "The file must be a JPEG under 240 KB, taken within the last 6 months, on a plain white or off-white background.",
      "The pixel and file-size limits are strict for the DV lottery: an image outside them is rejected by the entry form.",
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
    source: "GOV.UK, 'Get a passport photo' and 'Digital photos'",
    notes: [
      "35 x 45 mm printed. Digital uploads must be at least 600 x 750 pixels.",
      "Head measured chin to crown must be between 29 and 34 mm.",
      "Plain light grey or cream background, no pattern and no shadow behind you.",
      "No glasses at all, and nothing covering the face.",
      "Neutral expression with the mouth closed.",
    ],
  },
  {
    slug: "uk-visa",
    country: "United Kingdom",
    countryCode: "GB",
    document: "Visa",
    widthMm: 35,
    heightMm: 45,
    dpi: 600,
    pixelWidth: 827,
    pixelHeight: 1063,
    headMinMm: 29,
    headMaxMm: 34,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    source: "GOV.UK visa photo guidance (meets the UK passport photo standard)",
    notes: [
      "35 x 45 mm printed, the same size and rules as a UK passport photo.",
      "GOV.UK asks visa photos to meet the passport photo standard, so the head from chin to crown must be 29 to 34 mm.",
      "Plain cream or light grey background, evenly lit, with no shadow and no pattern.",
      "No glasses, a neutral expression and the mouth closed.",
      "Many UK visa routes now take your photo in the app, and the biometric residence permit photo is captured at the application centre. This size is for a printed photo where one is asked for.",
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
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    source: "France-Visas photograph instructions and the EU Visa Code / ICAO standard",
    notes: [
      "35 x 45 mm, the ICAO size used across the Schengen area.",
      "This one size covers a Schengen visa for any of the member countries, France, Germany, Italy, Spain, the Netherlands and the rest.",
      "The head measured chin to crown must be 32 to 36 mm, which is 70 to 80 percent of the height.",
      "Plain light grey background, evenly lit, with no pattern and no shadow.",
      "The rules come from the EU Visa Code and the ICAO standard, but individual consulates add their own guidance. Check the one you are applying to.",
    ],
  },
  {
    slug: "germany-passport",
    country: "Germany",
    countryCode: "DE",
    document: "Passport and ID card",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified against the German biometric passport photo template
    // (Bundesdruckerei / Bundesministerium des Innern "Fotomustertafel"), which
    // gives the face height as 32 to 36 mm on the 45 mm frame.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    source: "German Federal Ministry of the Interior / Bundesdruckerei biometric photo template",
    notes: [
      "35 x 45 mm, the German biometric standard for both the passport (Reisepass) and the ID card (Personalausweis).",
      "The face from chin to crown must measure 32 to 36 mm, which fills 70 to 80 percent of the height.",
      "Plain light grey background, evenly lit, with a neutral expression and the mouth closed.",
      "This is the same size and framing as the Schengen visa photo, because both follow the ICAO biometric standard.",
    ],
  },
  {
    slug: "france-passport",
    country: "France",
    countryCode: "FR",
    document: "Passport and ID card",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified against the ANTS (Agence nationale des titres sécurisés) photo
    // norms, which give the height of the face (menton au sommet du crâne) as 32
    // to 36 mm on the 45 mm frame.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    source: "France, ANTS (Agence nationale des titres sécurisés) photo norms",
    notes: [
      "35 x 45 mm, the French standard for the passport and the national ID card (carte d'identité).",
      "The face from chin to crown must measure 32 to 36 mm, 70 to 80 percent of the height.",
      "Plain light grey background, evenly lit, neutral expression, mouth closed.",
      "This matches the Schengen and ICAO biometric size.",
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
    source: "Directorate General of Immigration & Passports (DGI&P), Pakistan",
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
    source: "VFS Global and the Indian consulates in the United States",
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
    source: "Passport Seva (Ministry of External Affairs, India)",
    notes: [
      "4.5 x 3.5 cm, meaning 45 mm high by 35 mm wide, on a white background.",
      "The photo must show the full head, from the top of the hair to the bottom of the chin, facing forward with the eyes open.",
      "No chin-to-crown measurement is published, so this tool uses a general portrait ratio.",
      "Applications filed in India usually have the photo captured at the Passport Seva Kendra instead.",
    ],
  },
  {
    slug: "india-visa",
    country: "India",
    countryCode: "IN",
    document: "Visa and OCI",
    widthMm: 50.8,
    heightMm: 50.8,
    dpi: 300,
    pixelWidth: 600,
    pixelHeight: 600,
    // Verified: the Indian visa online system requires a square photo on a white
    // background, with equal height and width from 350 x 350 up to 1000 x 1000
    // pixels. No chin-to-crown range is published, so none is claimed. The 2 x 2
    // inch square is the printed form of the same requirement.
    eyeLineFromBottomMm: null,
    background: "white",
    source: "Indian Visa Online (indianvisaonline.gov.in) and OCI services",
    notes: [
      "A square photo on a plain white background. The online form wants equal width and height, from 350 x 350 up to 1000 x 1000 pixels; 600 x 600 (2 x 2 inches at 300 DPI) sits in that range.",
      "The same square white photo is used for an OCI (Overseas Citizen of India) application.",
      "The file must be a JPEG, roughly 10 KB to 1 MB.",
      "No chin-to-crown measurement is published, so this tool uses a general portrait ratio.",
    ],
  },
  {
    slug: "india-pan",
    country: "India",
    countryCode: "IN",
    document: "PAN card",
    // Verified: the PAN application (Form 49A) states "3.5 cm x 2.5 cm", a
    // portrait photo 25 mm wide by 35 mm tall.
    widthMm: 25,
    heightMm: 35,
    dpi: 300,
    pixelWidth: 295,
    pixelHeight: 413,
    eyeLineFromBottomMm: null,
    background: "white",
    source: "PAN application Form 49A (Income Tax Department of India / NSDL, UTIITSL)",
    notes: [
      "3.5 x 2.5 cm, meaning 25 mm wide by 35 mm tall, the size Form 49A asks you to affix.",
      "PAN does not mandate a background colour, so this tool uses plain white, which is the safe default and what most applicants use.",
      "No chin-to-crown measurement is published, so a general portrait ratio is used.",
      "You need two copies of this photo for a paper PAN application.",
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
    source: "Government of Canada (IRCC) passport photo specifications",
    notes: [
      "50 x 70 mm, the largest of the common passport sizes.",
      "The face from chin to crown must measure between 31 and 36 mm.",
      "Plain white or light coloured background with no shadow.",
      "Printed Canadian passport photos must carry the studio name and date on the back, which this tool cannot add.",
    ],
  },
  {
    slug: "canada-visa",
    country: "Canada",
    countryCode: "CA",
    document: "Visa (temporary resident)",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified: IRCC's photo specifications for a visa / temporary resident
    // application state 35 x 45 mm with the face 31 to 36 mm from chin to crown.
    headMinMm: 31,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "white",
    source: "Government of Canada (IRCC) visa / temporary resident photo specifications",
    notes: [
      "35 x 45 mm, which is the visa size, smaller than the 50 x 70 mm Canadian passport photo.",
      "The face from chin to crown must measure 31 to 36 mm.",
      "Plain white or light coloured background, no shadow.",
      "Neutral expression, mouth closed, taken within the last 6 months.",
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
    source: "Australian Passport Office photo guidelines",
    notes: [
      "35 x 45 mm, with the head measuring 32 to 36 mm from chin to crown.",
      "Plain light coloured background, not pure white and not patterned.",
      "Neutral expression, eyes open, facing the camera straight on, and nobody else in the photo.",
      "Nothing on the head or face, apart from a head covering worn for religious reasons.",
    ],
  },
  {
    slug: "australia-visa",
    country: "Australia",
    countryCode: "AU",
    document: "Visa",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified against the Australian Department of Home Affairs photo
    // requirements, which use 45 x 35 mm with the face 32 to 36 mm, the same
    // framing as the passport.
    headMinMm: 32,
    headMaxMm: 36,
    eyeLineFromBottomMm: null,
    background: "light-grey",
    source: "Australian Department of Home Affairs photo requirements",
    notes: [
      "35 x 45 mm, with the head 32 to 36 mm from chin to crown, the same framing the passport uses.",
      "Plain light coloured background, evenly lit, no shadow.",
      "Many visa applications are lodged online with a digital photo; this is the printed size where one is asked for.",
      "Neutral expression, eyes open, facing the camera straight on.",
    ],
  },
  {
    slug: "korea-passport",
    country: "South Korea",
    countryCode: "KR",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified size and background only: the Korean Ministry of Foreign Affairs
    // publishes 3.5 x 4.5 cm on a plain white background. This tool does not
    // claim a chin-to-crown figure for it.
    eyeLineFromBottomMm: null,
    background: "white",
    source: "South Korea Ministry of Foreign Affairs passport photo standard",
    notes: [
      "3.5 x 4.5 cm, meaning 35 mm wide by 45 mm tall, on a plain white background.",
      "Taken within the last 6 months, facing the camera straight on with a neutral expression.",
      "The online e-passport service has its own pixel requirements, so check those if you are uploading rather than printing.",
      "This tool uses a general portrait ratio for the head, since a single chin-to-crown figure is not claimed here.",
    ],
  },
  {
    slug: "singapore-passport",
    country: "Singapore",
    countryCode: "SG",
    document: "Passport",
    widthMm: 35,
    heightMm: 45,
    dpi: 300,
    pixelWidth: 413,
    pixelHeight: 531,
    // Verified size and background only: Singapore's ICA specifies a
    // 35 x 45 mm colour photograph on a plain white background. No chin-to-crown
    // figure is claimed here.
    eyeLineFromBottomMm: null,
    background: "white",
    source: "Singapore Immigration & Checkpoints Authority (ICA) photo guidelines",
    notes: [
      "35 x 45 mm, on a plain white background, taken within the last 3 months.",
      "The ICA online photo upload has its own exact pixel size, so if you are applying online check that rather than printing this.",
      "Full face, front view, eyes open, neutral expression, no head covering except for religious reasons.",
      "This tool uses a general portrait ratio for the head, since a single chin-to-crown figure is not claimed here.",
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
    source: "UAE Federal Authority for Identity and Citizenship (ICP)",
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
    source: "Saudi Ministry of Foreign Affairs / Enjaz",
    notes: [
      "4 x 6 cm, meaning 40 mm wide by 60 mm high, on a white background, with no exceptions on the background.",
      "This is the size used for a work, Hajj or Umrah visa filed through Enjaz.",
      "The face must fill 60 to 70 percent of the photo, which is 36 to 42 mm from chin to crown.",
      "Taken within the last 6 months, facing the camera directly.",
      "You will often see 2 x 2 inches quoted for Saudi visas. The Ministry of Foreign Affairs publishes 4 x 6 cm, which is what this tool produces.",
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
    source: "Chinese Visa Application Service Centre (CVASC)",
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
    source: "Japan Ministry of Foreign Affairs (MOFA) passport photo specification",
    notes: [
      "35 x 45 mm, with the head measuring 34 mm from chin to crown, give or take 2 mm.",
      "The gap above the head must be 4 mm, give or take 2, and the chin sits 7 mm from the bottom edge, give or take 2.",
      "Plain background with a clear edge between your hair and the background.",
      "Taken within the last 6 months, facing the camera straight on.",
    ],
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
    source: "Philippine Department of Foreign Affairs (DFA)",
    notes: [
      "2 x 2 inches on a plain white background, which is what the DFA and the Philippine posts abroad ask for.",
      "No eyeglasses.",
      "If you are applying in the Philippines, your photo is taken at the DFA appointment. This size is for applications at a consulate abroad and for supporting paperwork.",
      "No chin-to-crown range is published, so this tool uses a general portrait ratio.",
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
    // Could not be confirmed against an official source: the Department of
    // Immigration and Passports publishes no photo specification that could be
    // found, and every source quoting 45 x 55 mm is a third-party photo tool.
    eyeLineFromBottomMm: null,
    background: "white",
    source: "Not verified against an official source (see notes)",
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
    // Could not be confirmed against an official source: the Nigeria Immigration
    // Service has an image-compliance page but it could not be read, and no size
    // is stated anywhere else on their site.
    eyeLineFromBottomMm: null,
    background: "white",
    source: "Not verified against an official source (see notes)",
    notes: [
      "35 x 45 mm on a plain white background.",
      "The Nigeria Immigration Service does not publish this size in a form that could be checked, so treat it as a starting point.",
      "Your photograph is captured at the passport enrolment centre. A printed photo is mainly needed for supporting paperwork.",
      "No chin-to-crown range is published, so this tool uses a general portrait ratio.",
    ],
    needsVerification: true,
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
  // Lower the first letter only for an ordinary capitalised word (Passport,
  // Visa, Green). Leave an acronym alone, so "PAN card" does not become
  // "pAN card" and "OCI" stays "OCI".
  const document = /^[A-Z][a-z]/.test(spec.document)
    ? spec.document.charAt(0).toLowerCase() + spec.document.slice(1)
    : spec.document;
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
