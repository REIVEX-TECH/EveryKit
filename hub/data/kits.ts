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
export type KitCategory = "photos" | "documents" | "everyday";

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

export const kits: Kit[] = [
  {
    slug: "photos",
    name: "EveryKit Photos",
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
    })),
  };
}

export const CATEGORIES: Array<{ id: KitCategory | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "photos", label: "Photos & ID" },
  { id: "documents", label: "Documents & letters" },
  { id: "everyday", label: "Everyday" },
];
