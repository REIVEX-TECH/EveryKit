#!/usr/bin/env bash
#
# Pull, build and reload EveryKit on the VPS.
#
#   ./deploy.sh                  rebuild whatever changed since the last deploy
#   ./deploy.sh photos letters   rebuild exactly these, plus the hub if the
#                                registry moved
#   ./deploy.sh --all            rebuild all fourteen, the old behaviour
#   ./deploy.sh --dry-run        say what would be rebuilt and why, change
#                                nothing (combines with the modes above)
#
# ## Why there is a mode at all
#
# Fourteen Next builds take the best part of half an hour, and a typical
# commit touches one kit. The script records the commit it deployed in
# `.deployed-sha` and, next time, asks git which files changed since then.
# `deploy/lib/changed-kits.mjs` turns that file list into an app list; it is a
# pure function with its own tests in the hub's suite, because a rule about
# which app is stale is exactly the kind of thing that looks obvious and is
# wrong at the edges.
#
# ## What it refuses to do
#
# Nothing is reloaded until it has built. A build that fails takes its own app
# out of the reload list and leaves the running process alone, so a broken
# commit costs one stale kit rather than the site. The exit code is non-zero
# and the failures are listed at the end, where they can be seen.
#
# The recorded SHA only moves when every app that needed rebuilding actually
# built, and never on a run that named apps by hand: marking HEAD as deployed
# when a kit was skipped would make the next run skip it too, permanently.
#
# If `.deployed-sha` is missing, unreadable, or names a commit this checkout
# does not have, the script says so and rebuilds everything. The fallback is
# always the slow, safe direction.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

SHA_FILE="$ROOT/.deployed-sha"
LOCK_FILE="$ROOT/.deployed-locks"
MAPPER="$ROOT/deploy/lib/changed-kits.mjs"

# ---------------------------------------------------------------------------
# Arguments
# ---------------------------------------------------------------------------

DRY_RUN=0
FORCE_ALL=0
NAMED=()

for arg in "$@"; do
	case "$arg" in
	--dry-run | -n) DRY_RUN=1 ;;
	--all | -a) FORCE_ALL=1 ;;
	-h | --help)
		sed -n '2,28p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
		exit 0
		;;
	-*)
		echo "deploy: unknown flag $arg" >&2
		exit 2
		;;
	*) NAMED+=("$arg") ;;
	esac
done

# ---------------------------------------------------------------------------
# Pull
# ---------------------------------------------------------------------------

if [ "$DRY_RUN" = 1 ]; then
	echo "==> Dry run: not pulling, and reading the working tree as it stands"
else
	echo "==> Pulling"
	# --ff-only: refuse to create a merge commit on the server. If this fails,
	# something was committed on the box and needs sorting out by hand.
	git pull --ff-only
fi

HEAD_SHA="$(git rev-parse HEAD)"

# ---------------------------------------------------------------------------
# Which apps
# ---------------------------------------------------------------------------

DEPLOYED_SHA=""
SHA_PROBLEM=""

if [ ! -f "$SHA_FILE" ]; then
	SHA_PROBLEM="no $SHA_FILE, so this box has no record of what is deployed"
elif ! DEPLOYED_SHA="$(tr -d '[:space:]' <"$SHA_FILE" 2>/dev/null)" || [ -z "$DEPLOYED_SHA" ]; then
	SHA_PROBLEM="$SHA_FILE is empty or unreadable"
elif ! git cat-file -e "${DEPLOYED_SHA}^{commit}" 2>/dev/null; then
	SHA_PROBLEM="$SHA_FILE names $DEPLOYED_SHA, which is not a commit in this checkout"
fi

# Whether HEAD may be recorded as deployed at the end. A run that names apps by
# hand deliberately leaves other stale kits alone, so it must not claim them.
RECORD_SHA=1
MODE=""

# Command substitution rather than a process substitution into mapfile, so that
# a mapper that exits non-zero (an app name that does not exist) stops the
# deploy instead of quietly producing an empty list of things to build.
RAW=""

if [ "${#NAMED[@]}" -gt 0 ]; then
	MODE="named"
	RECORD_SHA=0
	RAW="$(node "$MAPPER" select "${NAMED[@]}")" || exit 2
	# Plus the hub when the registry moved, because the directory, /kits.json
	# and the sitemap index are all rendered from it.
	if [ -z "$SHA_PROBLEM" ] &&
		! printf '%s\n' "$RAW" | cut -f1 | grep -qx hub &&
		git diff --name-only "$DEPLOYED_SHA" "$HEAD_SHA" -- hub/data/kits.ts | grep -q .; then
		RAW="$RAW"$'\n''hub'$'\t''the kit registry changed'
	fi
elif [ "$FORCE_ALL" = 1 ]; then
	MODE="all"
	RAW="$(node "$MAPPER" all)"
elif [ -n "$SHA_PROBLEM" ]; then
	MODE="all"
	echo "deploy: $SHA_PROBLEM" >&2
	echo "deploy: rebuilding everything, which is the safe direction." >&2
	RAW="$(node "$MAPPER" all)"
else
	MODE="changed"
	RAW="$(git diff --name-only "$DEPLOYED_SHA" "$HEAD_SHA" | node "$MAPPER" changed)"
fi

SELECTED=()
while IFS= read -r line; do
	[ -n "$line" ] && SELECTED+=("$line")
done <<<"$RAW"

APPS=()
for line in "${SELECTED[@]}"; do
	[ -n "$line" ] && APPS+=("${line%%$'\t'*}")
done

echo
if [ "$MODE" = "changed" ]; then
	echo "==> Changed since ${DEPLOYED_SHA:0:8} (now at ${HEAD_SHA:0:8})"
else
	echo "==> Mode: $MODE (now at ${HEAD_SHA:0:8})"
fi

if [ "${#APPS[@]}" -eq 0 ]; then
	echo "    nothing to rebuild"
else
	for line in "${SELECTED[@]}"; do
		[ -n "$line" ] && printf '    %-11s %s\n' "${line%%$'\t'*}" "${line#*$'\t'}"
	done
fi

if [ "$DRY_RUN" = 1 ]; then
	echo
	echo "==> Dry run, stopping here. Nothing was installed, built or reloaded."
	exit 0
fi

# ---------------------------------------------------------------------------
# Dependencies, skipped when the lockfile has not moved
# ---------------------------------------------------------------------------

lock_hash() {
	sha256sum "$1/package-lock.json" 2>/dev/null | cut -d' ' -f1
}

recorded_lock_hash() {
	[ -f "$LOCK_FILE" ] || return 0
	awk -v app="$1" -F'\t' '$1 == app { print $2 }' "$LOCK_FILE" | head -1
}

# Rewritten wholesale at the end from this map, so a crash halfway cannot leave
# a hash recorded for an install that did not finish.
declare -A NEW_LOCK_HASH=()
if [ -f "$LOCK_FILE" ]; then
	while IFS=$'\t' read -r app hash; do
		[ -n "$app" ] && NEW_LOCK_HASH["$app"]="$hash"
	done <"$LOCK_FILE"
fi

for app in "${APPS[@]}"; do
	want="$(lock_hash "$app")"
	have="$(recorded_lock_hash "$app")"
	if [ -n "$want" ] && [ "$want" = "$have" ]; then
		echo "==> Dependencies unchanged: $app"
		continue
	fi
	echo "==> Installing dependencies: $app"
	# `npm ci` installs exactly the lockfile and removes anything stale, which
	# is what you want on a server. It needs package-lock.json to be in sync.
	npm ci --prefix "$app" --no-audit --no-fund
	NEW_LOCK_HASH["$app"]="$want"
done

# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

BUILT=()
FAILED=()

for app in "${APPS[@]}"; do
	echo "==> Building: $app"
	if npm run build --prefix "$app"; then
		BUILT+=("$app")
	else
		echo "deploy: $app failed to build. Its process is being left alone." >&2
		FAILED+=("$app")
	fi
done

# ---------------------------------------------------------------------------
# Reload, only what built
# ---------------------------------------------------------------------------

if [ "${#BUILT[@]}" -gt 0 ]; then
	echo "==> Reloading PM2: ${BUILT[*]}"
	for app in "${BUILT[@]}"; do
		process="everykit-$app"
		# --update-env so changes to .env.production are picked up. A plain
		# reload keeps the environment the process started with. A kit PM2 has
		# never seen has to be started rather than reloaded, which is what a
		# newly added kit's first deploy hits.
		if pm2 describe "$process" >/dev/null 2>&1; then
			pm2 reload ecosystem.config.js --only "$process" --update-env
		else
			echo "    $process is new to PM2, starting it"
			pm2 start ecosystem.config.js --only "$process" --update-env
		fi
	done
	pm2 save
else
	echo "==> Nothing built, so nothing reloaded"
fi

# ---------------------------------------------------------------------------
# The edge, then the record of what is deployed
# ---------------------------------------------------------------------------

# Always, and after PM2 on purpose: a new kit's nginx block must never point at
# a port nothing is listening on yet. edge.sh no-ops when the certificate
# already covers every name.
echo "==> Edge: nginx config and TLS"
"$ROOT/deploy/edge.sh"

{
	for app in "${!NEW_LOCK_HASH[@]}"; do
		printf '%s\t%s\n' "$app" "${NEW_LOCK_HASH[$app]}"
	done
} | sort >"$LOCK_FILE"

if [ "${#FAILED[@]}" -gt 0 ]; then
	echo
	echo "==> Finished with failures: ${FAILED[*]}"
	echo "    Their processes were not reloaded and are still serving the previous build."
	echo "    .deployed-sha was left at ${DEPLOYED_SHA:-nothing}, so the next run retries them."
	pm2 status
	exit 1
fi

if [ "$RECORD_SHA" = 1 ]; then
	printf '%s\n' "$HEAD_SHA" >"$SHA_FILE"
	echo "==> Recorded ${HEAD_SHA:0:8} as deployed"
else
	echo "==> Not recording a deployed commit: this run built only the apps it was given"
fi

echo
echo "==> Done"
pm2 status
