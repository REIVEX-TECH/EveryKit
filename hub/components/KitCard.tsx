import type { Kit } from "@/data/kits";
import { KitThumbnail } from "./KitThumbnail";

/**
 * One kit in the directory. A live kit is a single link covering the whole
 * card; a kit that does not exist yet is not a link, and carries no waitlist
 * form or email capture — there is nothing to sign up for.
 */
export function KitCard({ kit }: { kit: Kit }) {
  const live = kit.status === "live";

  const body = (
    <>
      <KitThumbnail slug={kit.slug} alt={kit.outputAlt} muted={!live} />
      {/* h2, not h3: these cards sit directly under the page h1, and skipping a
          level breaks heading navigation for screen-reader users. */}
      <div className="mt-4 flex items-baseline gap-2">
        <h2 className="text-[17px]">{kit.name}</h2>
        <Status live={live} />
      </div>
      <p className="mt-1 text-[15px] text-text-light">{kit.tagline}</p>
    </>
  );

  if (!live) {
    return <div className="ek-card bg-bg-soft p-5">{body}</div>;
  }

  return (
    <a
      href={kit.url}
      className="ek-card block p-5 no-underline transition-colors hover:border-primary"
    >
      {body}
    </a>
  );
}

function Status({ live }: { live: boolean }) {
  if (!live) {
    return <span className="text-[13px] text-text-light">coming soon</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-text-light">
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-success" />
      live
    </span>
  );
}
