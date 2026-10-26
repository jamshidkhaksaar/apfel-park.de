#!/usr/bin/env bash
# Probe the public surface of a running Apfel Park release, straight at nginx.
#
#   probe-public-surface.sh <app-root> <probe-token>
#
# Why this is a script of its own: several properties of the proxy in front of
# the app can break real clients while looking perfectly healthy from outside,
# because the CDN answers from its own cache.
#
#   - The shared asset archive has to keep serving older builds' hashed assets,
#     so a browser holding yesterday's page still finds its JS and CSS. An alias
#     aimed at the current release alone 404ed every older asset behind a warm
#     edge cache, unnoticed, because the edge answered from cache.
#   - A missing asset must not be advertised as cacheable. `add_header
#     Cache-Control ... always` once made a transient 404 "public,
#     max-age=2592000, immutable", and the edge served that broken asset for a
#     month.
#   - The markdown twins are what crawlers and AI agents read instead of the
#     HTML, and they are also the URLs Next rewrites internally: it copies the
#     rewrite destination onto the response as x-middleware-rewrite, so a
#     regression here either serves an agent HTML or publishes
#     http://localhost:3000/api/md/... to the world.
#
# deploy-app.sh runs this after activation, where a failure rolls the release
# back. apfel-park-public-surface-probe.timer runs it hourly, so a vhost or
# header change between deploys is noticed within the hour instead of at the
# next release. The first failure exits non-zero with a message on stderr.
#
# Every request goes to the origin via --resolve, never through the CDN.
set -euo pipefail

usage="usage: probe-public-surface.sh <app-root> <probe-token>"
APP_ROOT="${1:?$usage}"
probe_token="${2:?$usage}"
RELEASES="$APP_ROOT/releases"
CURRENT="$APP_ROOT/current"

log() { printf '[probe] %s\n' "$*"; }
die() { printf '[probe] ERROR: %s\n' "$*" >&2; exit 1; }

[ -d "$RELEASES" ] || die "missing releases directory: $RELEASES"
[ -d "$CURRENT" ] || die "missing current release: $CURRENT"

origin_https() {
  curl -sS --resolve apfel-park.de:443:127.0.0.1 --connect-timeout 3 --max-time 10 "$@"
}

log "older release asset continuity"
current_release="$(readlink -f "$CURRENT")"
probed_releases=0
for old in "$RELEASES"/*/; do
  old="${old%/}"
  [ -d "$old" ] || continue
  # The release that is serving now is covered by the live checks below.
  if [ "$(readlink -f "$old")" = "$current_release" ]; then continue; fi
  # A failed release never served traffic and is kept for inspection only.
  if [ -f "$old/.deploy-failed" ]; then continue; fi
  old_asset="$(find "$old/.next/static" -type f -name '_buildManifest.js' -print -quit 2>/dev/null || true)"
  [ -n "$old_asset" ] \
    || old_asset="$(find "$old/.next/static" -type f -name '*.js' -print -quit 2>/dev/null || true)"
  if [ -z "$old_asset" ]; then
    log "  $(basename "$old"): no static assets to probe"
    continue
  fi
  old_path="/_next/static/${old_asset#"$old/.next/static/"}"
  code="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$old_path" || true)"
  [ "$code" = 200 ] || die "older release $(basename "$old") no longer serves $old_path ($code); the /_next/static alias must keep serving the shared archive"
  probed_releases=$((probed_releases + 1))
  log "  $(basename "$old") -> $old_path 200"
done
if [ "$probed_releases" -eq 0 ]; then
  log "  WARNING: no retained release with assets to probe"
fi

log "missing asset caching"
missing_path="/_next/static/deploy-probe-$probe_token-missing.js"
missing_code="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$missing_path" || true)"
[ "$missing_code" = 404 ] || die "missing asset $missing_path returned $missing_code, expected 404"
missing_cache_control="$(origin_https -o /dev/null -D - "https://apfel-park.de$missing_path" | tr -d '\r' | grep -i '^cache-control:' || true)"
if printf '%s' "$missing_cache_control" | grep -qi 'immutable'; then
  die "missing asset $missing_path is served as immutable: $missing_cache_control"
fi
for max_age in $(printf '%s' "$missing_cache_control" | grep -oE 'max-age=[0-9]+' | cut -d= -f2 || true); do
  if [ "$max_age" -ge 86400 ]; then
    die "missing asset $missing_path is cached for ${max_age}s: $missing_cache_control"
  fi
done
log "  $missing_path -> 404, no long-lived caching"

origin_header() {
  local path=$1 name=$2
  shift 2
  origin_https -o /dev/null -D - "$@" "https://apfel-park.de$path" \
    | tr -d '\r' | grep -i "^$name:" | head -n1 \
    | sed -E "s/^[^:]*:[[:space:]]*//" || true
}

log "markdown twins"
# Take the probe path from the route table the app itself ships, so renaming a
# page cannot turn this check into a false failure.
twin_path="$(grep -oE "pattern: '/[a-z0-9-]+', kind: 'content'" "$CURRENT/src/lib/md/routes.ts" \
  | head -n1 | sed -E "s/pattern: '([^']*)'.*/\1/" || true)"
[ -n "$twin_path" ] \
  || die "could not derive a content markdown twin from $CURRENT/src/lib/md/routes.ts"
twin_md="/de$twin_path.md"
twin_html="/de$twin_path"

# 1. The .md URL is markdown, whatever the client says it accepts.
md_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$twin_md" || true)"
[ "$md_status" = 200 ] || die "$twin_md returned $md_status, expected 200"
md_type="$(origin_header "$twin_md" content-type)"
case "$md_type" in
  *text/markdown*) ;;
  *) die "$twin_md is not markdown: ${md_type:-no content-type}" ;;
esac

# 2. The same URL still serves HTML, and swaps to markdown only for a client
#    that asks with a strictly higher q-value than text/html.
html_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$twin_html" || true)"
[ "$html_status" = 200 ] || die "$twin_html returned $html_status, expected 200"
html_type="$(origin_header "$twin_html" content-type)"
case "$html_type" in
  *text/html*) ;;
  *) die "$twin_html is not HTML: ${html_type:-no content-type}" ;;
esac
negotiated_type="$(origin_header "$twin_html" content-type -H 'Accept: text/markdown')"
case "$negotiated_type" in
  *text/markdown*) ;;
  *) die "$twin_html did not negotiate to markdown for Accept: text/markdown (${negotiated_type:-no content-type})" ;;
esac

# 3. Neither markdown response may name the internal upstream.
leaked="$(origin_header "$twin_md" x-middleware-rewrite)"
[ -z "$leaked" ] || die "$twin_md leaks the internal rewrite target: $leaked"
leaked="$(origin_header "$twin_html" x-middleware-rewrite -H 'Accept: text/markdown')"
[ -z "$leaked" ] || die "$twin_html leaks the internal rewrite target: $leaked"

# 4. One URL carries two representations, so a response a shared cache may store
#    has to list Accept in Vary; without it a CDN cannot tell them apart and
#    hands markdown to a browser (or HTML to an agent) that asked for the other.
#    Responses that forbid shared caching (no-store/private) are exempt, which
#    is why the plain HTML page carries no token today.
vary_checked=0
require_accept_vary() {
  local path=$1 cache_control vary token
  shift
  cache_control="$(origin_header "$path" cache-control "$@")"
  case "$cache_control" in
    *no-store*|*private*) return 0 ;;
  esac
  vary_checked=$((vary_checked + 1))
  vary="$(origin_header "$path" vary "$@")"
  # Compare tokens, not substrings: Accept-Encoding must not pass for Accept.
  for token in $(printf '%s' "$vary" | tr ',' ' ' | tr 'A-Z' 'a-z'); do
    [ "$token" = "accept" ] && return 0
  done
  die "$path is cacheable (${cache_control:-no cache-control}) but Vary does not list Accept: ${vary:-no vary}"
}

require_accept_vary "$twin_md"
require_accept_vary "$twin_html"
require_accept_vary "$twin_html" -H 'Accept: text/markdown'
if [ "$vary_checked" -eq 0 ]; then
  log "  WARNING: no probed response is shared-cacheable; the Vary rule checked nothing"
else
  log "  $vary_checked shared-cacheable response(s) list Accept in Vary"
fi

# 5. A .md URL with no twin must answer a markdown 404 that no cache may keep.
#    An agent asking for markdown would otherwise get an HTML error page, and a
#    cached 404 outlives the release that caused it -- a page whose twin lands in
#    the next deploy would stay broken at the edge until the cache expired.
no_twin="/de/no-twin-$probe_token.md"
no_twin_status="$(origin_https -o /dev/null -w '%{http_code}' "https://apfel-park.de$no_twin" || true)"
[ "$no_twin_status" = 404 ] || die "$no_twin returned $no_twin_status, expected 404"
no_twin_type="$(origin_header "$no_twin" content-type)"
case "$no_twin_type" in
  *text/markdown*) ;;
  *) die "$no_twin is not a markdown response: ${no_twin_type:-no content-type}" ;;
esac
no_twin_cache="$(origin_header "$no_twin" cache-control)"
case "$no_twin_cache" in
  *no-store*) ;;
  *) die "$no_twin is cacheable (${no_twin_cache:-no cache-control}); a cached 404 outlives the release that caused it" ;;
esac

log "  $twin_md -> ${md_type:-?}"
log "  $twin_html -> ${html_type:-?}, and ${negotiated_type:-?} for Accept: text/markdown"
log "  $twin_md and $twin_html expose no x-middleware-rewrite"
log "  $no_twin -> 404 markdown, no-store"
log "public surface OK"
