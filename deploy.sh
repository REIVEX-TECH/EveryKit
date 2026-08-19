#!/usr/bin/env bash
#
# Pull, build, and reload EveryKit on the VPS.
#
#   cd /root/codes/EveryKit && ./deploy.sh
#
# The order matters: everything is built BEFORE anything is reloaded. A build
# that fails must stop the script while the old, working processes are still
# serving traffic — which is what `set -e` buys here. Reloading first and
# building second would take the site down on a broken commit.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "==> Pulling"
# --ff-only: refuse to create a merge commit on the server. If this fails,
# something was committed on the box and needs sorting out by hand.
git pull --ff-only

for app in letters photos pdf qr images background text sign hub; do
	echo "==> Installing dependencies: $app"
	# `npm ci` installs exactly the lockfile and removes anything stale, which
	# is what you want on a server. It needs package-lock.json to be in sync.
	npm ci --prefix "$app" --no-audit --no-fund
done

# Built in dependency order of least to most important: if the hub build is the
# one that breaks, the kits have already built and the failure is obvious.
for app in letters photos pdf qr images background text sign hub; do
	echo "==> Building: $app"
	npm run build --prefix "$app"
done

echo "==> Reloading PM2"
# --update-env so changes to .env.production are picked up. A plain reload
# keeps the environment the processes started with.
pm2 reload ecosystem.config.js --update-env

pm2 save

echo
echo "==> Done"
pm2 status
