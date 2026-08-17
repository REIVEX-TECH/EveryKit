/**
 * The kit registry. Single source of truth for both the directory on `/` and
 * the JSON served at `/kits.json`, so the page and the file every kit reads can
 * never disagree.
 *
 * Adding a kit means adding an entry here and nothing else.
 */

export type KitStatus = "live" | "soon";

export type Kit = {
  slug: string;
  name: string;
  tagline: string;
  url: string;
  status: KitStatus;
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
    outputAlt:
      "A square passport photo with guide lines marking where the top of the head and the chin must fall",
  },
  {
    slug: "letters",
    name: "EveryKit Letters",
    tagline: "Formal letters, written for you",
    url: "https://letters.useeverykit.com",
    status: "soon",
    outputAlt: "A page of a formal letter",
  },
];

/** Exactly the shape published at /kits.json, per the shared registry schema. */
export function registryPayload(): {
  kits: Array<Omit<Kit, "outputAlt">>;
} {
  return {
    kits: kits.map(({ slug, name, tagline, url, status }) => ({
      slug,
      name,
      tagline,
      url,
      status,
    })),
  };
}
