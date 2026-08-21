/**
 * Which apps a set of changed files makes stale.
 *
 * This is the whole of the thinking behind a selective deploy, kept as one
 * pure function so it can be tested without a VPS, a git history or a build.
 * `deploy.sh` calls the CLI at the bottom with a list of paths on stdin and
 * reads back the app names, one per line.
 *
 * Deliberately dependency-free ESM: it runs under whatever node the box has,
 * with no install step in front of it, because it is the thing that decides
 * whether an install is needed.
 */

/** Every deployable app, by directory name, which is also its PM2 suffix. */
export const APPS = [
  "hub",
  "photos",
  "letters",
  "pdf",
  "qr",
  "images",
  "background",
  "text",
  "sign",
  "invoice",
  "ringtone",
  "dev",
  "study",
  "calc",
];

/**
 * Build order: kits first, hub last.
 *
 * Inherited from the old script and kept for the same reason. If the hub is
 * the build that breaks, every kit has already built and the failure is
 * unambiguous rather than buried in the middle of a run.
 */
export const BUILD_ORDER = [
  "letters",
  "photos",
  "pdf",
  "qr",
  "images",
  "background",
  "text",
  "sign",
  "invoice",
  "ringtone",
  "dev",
  "study",
  "calc",
  "hub",
];

/**
 * Paths that make every app stale.
 *
 * A prefix match, so `db/` covers everything under it. These are the files no
 * single app owns, where the honest answer to "which app does this affect" is
 * "possibly any of them".
 *
 * `deploy/` and `deploy.sh` are on this list even though neither can change a
 * build output. That is a deliberate over-rebuild: the cost is one slow deploy
 * on the rare commit that touches the deploy tooling, and the alternative is a
 * rule that has to be right about which parts of the tooling are inert.
 */
export const SHARED_PATHS = [
  "CLAUDE.md",
  "db/",
  "deploy/",
  "deploy.sh",
  "ecosystem.config.js",
  "docker-compose.yml",
  ".env.production.example",
];

/**
 * Paths that make nothing stale.
 *
 * Prose and pictures that no build reads. Listed explicitly rather than
 * inferred, so that a new top-level directory defaults to "rebuild
 * everything" instead of being silently ignored.
 */
export const INERT_PATHS = [
  "README.md",
  "LAUNCH.md",
  "docs/",
  "assets/",
  "brand/",
  ".gitignore",
  ".github/",
];

/** The registry the hub renders its directory and /kits.json from. */
export const REGISTRY_PATH = "hub/data/kits.ts";

/** Normalises a path the way git prints it, so Windows separators cannot leak in. */
function tidy(path) {
  return String(path).trim().replace(/\\/g, "/").replace(/^\.\//, "");
}

function matchesPrefix(path, prefixes) {
  return prefixes.some((prefix) =>
    prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix,
  );
}

/**
 * Given the files that changed, work out which apps have to be rebuilt and
 * why.
 *
 * @param {string[]} paths repo-relative paths, as `git diff --name-only` prints them
 * @param {{ apps?: string[] }} [options]
 * @returns {{ apps: string[], reasons: Record<string, string[]>, ignored: string[] }}
 *   `apps` in build order; `reasons` maps an app to the one-line explanations
 *   the dry run prints; `ignored` is every path that changed nothing, so a
 *   deploy can say so rather than leaving it to be guessed at.
 */
export function appsForChanges(paths, options = {}) {
  const apps = options.apps ?? APPS;
  const stale = new Set();
  /** @type {Record<string, string[]>} */
  const reasons = {};
  const ignored = [];

  const note = (app, reason) => {
    stale.add(app);
    reasons[app] = reasons[app] ?? [];
    if (!reasons[app].includes(reason)) reasons[app].push(reason);
  };

  for (const raw of paths) {
    const path = tidy(raw);
    if (path === "") continue;

    if (path === REGISTRY_PATH) {
      // Belongs to the hub by location, and named separately because it is the
      // one file whose meaning is bigger than its directory: the sitemaps, the
      // cross-promo strips and the search all read what it says.
      note("hub", "the kit registry changed");
      continue;
    }

    if (matchesPrefix(path, SHARED_PATHS)) {
      for (const app of apps) note(app, `${path} is shared by every app`);
      continue;
    }

    if (matchesPrefix(path, INERT_PATHS)) {
      ignored.push(path);
      continue;
    }

    const owner = apps.find((app) => path.startsWith(`${app}/`));
    if (owner) {
      note(owner, `${owner}/ changed`);
      continue;
    }

    // Something at the top level nobody claims. A morning report is the common
    // case and harmless, but guessing "inert" about an unknown file is how a
    // stale kit ends up serving, so the safe answer is everything.
    if (/^MORNING-REPORT.*\.md$/.test(path)) {
      ignored.push(path);
      continue;
    }
    for (const app of apps) note(app, `${path} is not owned by any app`);
  }

  return {
    apps: BUILD_ORDER.filter((app) => stale.has(app)),
    reasons,
    ignored,
  };
}

/**
 * Put a caller-supplied list of app names into build order, rejecting names
 * that are not apps.
 *
 * @param {string[]} names
 * @returns {{ apps: string[], unknown: string[] }}
 */
export function selectApps(names) {
  const wanted = new Set(names.map((name) => tidy(name)));
  const unknown = [...wanted].filter((name) => !APPS.includes(name));
  return {
    apps: BUILD_ORDER.filter((app) => wanted.has(app)),
    unknown,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
//
//   ... | node changed-kits.mjs changed     paths on stdin
//         node changed-kits.mjs select a b  names as arguments
//         node changed-kits.mjs all
//
// Every mode prints one line per app, in build order, as
// `<app><TAB><why>`. The shell takes field one for the work and field two
// for the dry run's explanation, so both come from the same call and cannot
// disagree with each other.

// pathToFileURL rather than string-building a file:// prefix, because the two
// disagree about how many slashes a Windows drive letter needs and the check
// would silently never fire.
const { pathToFileURL } = await import("node:url");
const invokedDirectly =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const [mode, ...rest] = process.argv.slice(2);

  const emit = (app, why) => process.stdout.write(`${app}\t${why}\n`);

  if (mode === "all") {
    for (const app of BUILD_ORDER) emit(app, "every app was asked for");
  } else if (mode === "select") {
    const { apps, unknown } = selectApps(rest);
    if (unknown.length > 0) {
      process.stderr.write(`not an app: ${unknown.join(", ")}\n`);
      process.stderr.write(`apps are: ${APPS.join(", ")}\n`);
      process.exit(2);
    }
    for (const app of apps) emit(app, "named on the command line");
  } else if (mode === "changed") {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const paths = Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
    const { apps, reasons, ignored } = appsForChanges(paths);
    for (const app of apps) emit(app, reasons[app].join("; "));
    if (ignored.length > 0) {
      process.stderr.write(`nothing to rebuild for: ${ignored.join(", ")}\n`);
    }
  } else {
    process.stderr.write("usage: changed-kits.mjs all | select <app>... | changed < paths\n");
    process.exit(2);
  }
}
