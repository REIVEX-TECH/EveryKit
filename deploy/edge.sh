#!/usr/bin/env bash
#
# The edge: nginx config and TLS, both derived from the kit registry.
#
# Run by deploy.sh after PM2 has reloaded. Safe to run on its own:
#
#   cd /root/codes/EveryKit && sudo ./deploy/edge.sh
#
# What it does, in order:
#
#   1. Reads every hostname out of hub/data/kits.ts, plus the apex and www.
#      The registry is the only place a kit is declared, so the certificate
#      and the config can never fall behind it.
#   2. Checks each name resolves to the same address as the apex. With the
#      wildcard A record in place they all do; if one does not, TLS is left
#      alone rather than spent on a request Let's Encrypt would reject.
#   3. Installs deploy/nginx/useeverykit.conf into sites-available, with
#      `nginx -t` as a hard gate and the previous file kept for rollback.
#   4. Compares the registry's names to the SAN list on the live certificate.
#      Only when a name is missing does certbot run, and then with --expand
#      and the whole list. Nothing missing means no issuance request at all:
#      Let's Encrypt counts attempts, not successes, and a deploy that runs
#      several times a day would burn the week's allowance in a fortnight.
#   5. Reinstalls the certificate into the fresh config and reloads.
#
# ## Why step 5 exists
#
# `certbot --nginx` writes the 443 blocks and the 80->443 redirects into the
# file it finds in sites-available. Step 3 replaces that file with the repo's,
# which has only the port 80 blocks, so the TLS blocks are gone the moment it
# lands. `certbot install` puts them back from the certificate already on
# disk. It makes no network request and issues nothing, so it costs nothing to
# run on every deploy, and it means the file in the repo stays the readable
# truth about which host proxies to which port while certbot keeps ownership
# of the TLS half.
#
# Nothing is reloaded between steps 3 and 5. nginx carries on serving the
# configuration it already has, TLS included, until the new one has passed
# `nginx -t` with the certificate reinstalled. A failure anywhere leaves the
# running edge untouched.

# -E so the ERR trap below fires from inside functions too.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

CERT_NAME="useeverykit.com"
CONTACT="hello@useeverykit.com"
SITE_AVAILABLE="/etc/nginx/sites-available/useeverykit.conf"
SITE_ENABLED="/etc/nginx/sites-enabled/useeverykit.conf"
SOURCE_CONF="$ROOT/deploy/nginx/useeverykit.conf"
LIVE_CERT="/etc/letsencrypt/live/$CERT_NAME/fullchain.pem"

# ---------------------------------------------------------------------------
# 1. The names, from the registry
# ---------------------------------------------------------------------------

# Each kit entry carries its url a line or two above its status, so the url is
# held until the status that follows it says whether the kit is live. A kit
# marked "soon" has no process listening and no block in the config, so asking
# for a certificate covering it would fail the challenge for all of them.
registry_hosts() {
	awk '
		/url: *"https:\/\// {
			if (match($0, /https:\/\/[^"]+/)) {
				pending = substr($0, RSTART + 8, RLENGTH - 8)
			}
			next
		}
		/status: *"live"/ {
			if (pending != "") { print pending; pending = "" }
			next
		}
		/status: *"soon"/ { pending = ""; next }
	' "$ROOT/hub/data/kits.ts"
}

APEX="useeverykit.com"
DOMAINS=("$APEX" "www.$APEX")
while read -r host; do
	[ -n "$host" ] && DOMAINS+=("$host")
done < <(registry_hosts)

if [ "${#DOMAINS[@]}" -lt 3 ]; then
	echo "edge: read only ${#DOMAINS[@]} names out of the registry, which cannot be right." >&2
	exit 1
fi

echo "  ${#DOMAINS[@]} names in the registry: ${DOMAINS[*]}"

# ---------------------------------------------------------------------------
# 2. DNS, before anything is asked of Let's Encrypt
# ---------------------------------------------------------------------------

resolve() { getent ahostsv4 "$1" 2>/dev/null | awk 'NR==1 {print $1}'; }

APEX_IP="$(resolve "$APEX" || true)"
if [ -z "$APEX_IP" ]; then
	echo "edge: $APEX does not resolve. Leaving TLS alone." >&2
	exit 1
fi

UNRESOLVED=()
for d in "${DOMAINS[@]}"; do
	ip="$(resolve "$d" || true)"
	[ "$ip" = "$APEX_IP" ] || UNRESOLVED+=("$d")
done

if [ "${#UNRESOLVED[@]}" -gt 0 ]; then
	echo "edge: these do not resolve to $APEX_IP yet: ${UNRESOLVED[*]}" >&2
	echo "edge: nginx will be updated, but TLS is left as it is." >&2
fi

# ---------------------------------------------------------------------------
# 3. The config, with a rollback
# ---------------------------------------------------------------------------

BACKUP="$(mktemp /tmp/useeverykit.conf.XXXXXX)"
restored=0

restore() {
	[ "$restored" = 1 ] && return
	restored=1
	if [ -s "$BACKUP" ]; then
		cp "$BACKUP" "$SITE_AVAILABLE"
		echo "edge: rolled the nginx config back to what was running." >&2
	fi
}
trap 'restore' ERR

if [ -f "$SITE_AVAILABLE" ]; then
	cp "$SITE_AVAILABLE" "$BACKUP"
else
	# First run on this box. There is nothing to roll back to, so the gate
	# below is the only thing standing between a typo and a broken edge.
	: >"$BACKUP"
fi

install -m 0644 "$SOURCE_CONF" "$SITE_AVAILABLE"
ln -sfn "$SITE_AVAILABLE" "$SITE_ENABLED"

if ! nginx -t; then
	restore
	nginx -t >/dev/null 2>&1 || echo "edge: the previous config does not pass either." >&2
	exit 1
fi

# ---------------------------------------------------------------------------
# 4. The certificate, expanded only when a name is actually missing
# ---------------------------------------------------------------------------

cert_sans() {
	[ -f "$LIVE_CERT" ] || return 0
	openssl x509 -in "$LIVE_CERT" -noout -text |
		awk '/X509v3 Subject Alternative Name/ { getline; gsub(/DNS:/, ""); gsub(/,/, "\n"); print }' |
		tr -d ' ' | grep -v '^$' || true
}

MISSING=()
if [ -f "$LIVE_CERT" ]; then
	existing="$(cert_sans)"
	for d in "${DOMAINS[@]}"; do
		grep -qxF "$d" <<<"$existing" || MISSING+=("$d")
	done
else
	MISSING=("${DOMAINS[@]}")
fi

if [ "${#MISSING[@]}" -gt 0 ] && [ "${#UNRESOLVED[@]}" -gt 0 ]; then
	echo "edge: ${#MISSING[@]} name(s) missing from the certificate, but DNS is not ready." >&2
	echo "edge: skipping certbot so the attempt is not wasted. Re-run once DNS has caught up." >&2
	MISSING=()
fi

if [ "${#MISSING[@]}" -gt 0 ]; then
	echo "  missing from the certificate: ${MISSING[*]}"
	echo "  expanding to all ${#DOMAINS[@]} names"

	# --expand because a subset of the existing names would otherwise be read
	# as a different certificate; every name that is already on it has to be
	# listed again or it is dropped. --keep-until-expiring so a run that
	# reaches here with nothing new to add still does not re-issue.
	args=()
	for d in "${DOMAINS[@]}"; do args+=(-d "$d"); done
	certbot --nginx --expand \
		--cert-name "$CERT_NAME" \
		"${args[@]}" \
		--non-interactive --agree-tos --keep-until-expiring \
		--email "$CONTACT" --no-eff-email \
		--redirect
else
	echo "  certificate already covers all ${#DOMAINS[@]} names; no issuance requested"
fi

# ---------------------------------------------------------------------------
# 5. Put the TLS blocks back into the config installed at step 3, and reload
# ---------------------------------------------------------------------------

if [ -f "$LIVE_CERT" ]; then
	# Reads the certificate off disk and writes the server blocks. No network
	# request, no issuance, no rate limit touched. Idempotent.
	certbot install --cert-name "$CERT_NAME" --nginx \
		--non-interactive --redirect
fi

if ! nginx -t; then
	restore
	systemctl reload nginx || true
	echo "edge: the config did not pass after certbot; rolled back." >&2
	exit 1
fi

systemctl reload nginx
trap - ERR
rm -f "$BACKUP"

echo "  nginx reloaded"
if [ -f "$LIVE_CERT" ]; then
	echo "  certificate now covers:"
	cert_sans | sed 's/^/    /'
fi

# ---------------------------------------------------------------------------
# 6. Renewal: the timer, and where the warnings go
# ---------------------------------------------------------------------------
#
# Neither of these can fail the deploy. The site is already serving; a renewal
# that is not wired up correctly is a problem for two months' time, and the
# right response is to say so loudly, not to roll back a working release.

if systemctl list-timers --all 2>/dev/null | grep -q 'certbot'; then
	next="$(systemctl list-timers --all certbot.timer snap.certbot.renew.timer 2>/dev/null |
		awk 'NR==2 {print $1, $2, $3, $4}')"
	echo "  renewal timer active, next run ${next:-unknown}"
else
	echo "edge: no certbot renewal timer found. The certificate will expire." >&2
	echo "edge: fix with  systemctl enable --now certbot.timer" >&2
fi

# The expiry warnings go to the ACME account's contact, which is set once and
# then forgotten about, so it is worth checking rather than assuming. Changed
# only when the address is actually absent, for the same reason certbot is only
# run when a name is actually missing.
if ! certbot show_account 2>/dev/null | grep -qi "$CONTACT"; then
	echo "  ACME account contact does not include $CONTACT; setting it"
	certbot update_account --email "$CONTACT" --no-eff-email --non-interactive || {
		echo "edge: could not set the account contact. Expiry warnings may go nowhere." >&2
	}
else
	echo "  expiry warnings go to $CONTACT"
fi
