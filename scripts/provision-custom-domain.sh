#!/usr/bin/env bash
# =============================================================================
# Provision an nginx vhost for a custom tenant domain.
#
#   sudo scripts/provision-custom-domain.sh <domain> [email]
#
# The script is idempotent: re-running it re-renders the vhost from
# deploy/nginx/custom-domain.conf.template, keeps the existing certificate when
# it still covers the domain, and verifies afterwards that the tenant API is
# reachable on the domain's own origin.
#
# Routing contract (see the template for the full rationale):
#   /api/*     -> Laravel (php-fpm)
#   /sanctum/* -> Laravel (php-fpm)
#   /*         -> Next.js SSR
# =============================================================================
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-${SSL_EMAIL:-admin@teachify.tech}}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMPLATE="$REPO_ROOT/deploy/nginx/custom-domain.conf.template"

NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"
CERTBOT_ROOT="/var/www/teachify/certbot"
API_ROOT="/var/www/teachify/apps/api/public"
PHP_FPM_SOCK="/run/php/php8.4-fpm.sock"
NEXT_UPSTREAM="http://127.0.0.1:3000"
CERT_DIR="/etc/letsencrypt/live/$DOMAIN"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[!]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

[ -n "$DOMAIN" ] || die "Usage: $0 <domain> [email]"
[ -f "$TEMPLATE" ] || die "Template not found: $TEMPLATE"
[ "$(id -u)" -eq 0 ] || die "Run as root"
command -v nginx >/dev/null 2>&1 || die "nginx is not installed"

# ── www support ─────────────────────────────────────────────────────────────
# A "www" host is only usable when it resolves AND the certificate covers it.
WWW_HOST="www.$DOMAIN"
SANS=("-d" "$DOMAIN")
WWW_BLOCK=""
if getent hosts "$WWW_HOST" >/dev/null 2>&1; then
    log "www host resolves: adding www.$DOMAIN to the certificate"
    SANS+=("-d" "$WWW_HOST")
    WWW_BLOCK="server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $WWW_HOST;

    ssl_certificate $CERT_DIR/fullchain.pem;
    ssl_certificate_key $CERT_DIR/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://$DOMAIN\$request_uri;
}
"
else
    warn "www.$DOMAIN does not resolve: the certificate and vhost will only cover $DOMAIN"
fi

# ── certificate ─────────────────────────────────────────────────────────────
cert_covers_domain() {
    [ -f "$CERT_DIR/fullchain.pem" ] || return 1
    local sans
    sans="$(openssl x509 -in "$CERT_DIR/fullchain.pem" -noout -ext subjectAltName 2>/dev/null || true)"
    printf '%s' "$sans" | grep -q "DNS:$DOMAIN" || return 1
    if [ -n "$WWW_BLOCK" ]; then
        printf '%s' "$sans" | grep -q "DNS:$WWW_HOST" || return 1
    fi
    return 0
}

if cert_covers_domain; then
    log "certificate for $DOMAIN is valid — keeping it"
else
    command -v certbot >/dev/null 2>&1 || die "certbot is not installed"
    log "requesting certificate for ${SANS[*]}"
    mkdir -p "$CERTBOT_ROOT"
    certbot certonly \
        --webroot -w "$CERTBOT_ROOT" \
        --cert-name "$DOMAIN" \
        "${SANS[@]}" \
        --non-interactive --agree-tos -m "$EMAIL" \
        --keep-until-expiring --force-renewal \
        || die "certbot failed"
    cert_covers_domain || die "the issued certificate does not cover $DOMAIN"
fi

# ── render the vhost ────────────────────────────────────────────────────────
RENDERED="$(mktemp)"
trap 'rm -f "$RENDERED"' EXIT

sed \
    -e "s|__DOMAIN__|$DOMAIN|g" \
    -e "s|__CERT_DIR__|$CERT_DIR|g" \
    -e "s|__CERTBOT_ROOT__|$CERTBOT_ROOT|g" \
    -e "s|__API_ROOT__|$API_ROOT|g" \
    -e "s|__PHP_FPM_SOCK__|$PHP_FPM_SOCK|g" \
    -e "s|__NEXT_UPSTREAM__|$NEXT_UPSTREAM|g" \
    "$TEMPLATE" > "$RENDERED"

if [ -n "$WWW_BLOCK" ]; then
    printf '\n%s\n' "$WWW_BLOCK" >> "$RENDERED"
fi

TARGET="$NGINX_AVAILABLE/$DOMAIN"
BACKUP=""
if [ -f "$TARGET" ]; then
    BACKUP="$TARGET.bak.$(date +%s)"
    cp -a "$TARGET" "$BACKUP"
    log "previous vhost backed up to $BACKUP"
fi

install -m 644 "$RENDERED" "$TARGET"
ln -sfn "$TARGET" "$NGINX_ENABLED/$DOMAIN"

if ! nginx -t; then
    warn "nginx configuration is invalid — rolling back"
    if [ -n "$BACKUP" ]; then
        cp -a "$BACKUP" "$TARGET"
    else
        rm -f "$TARGET"
    fi
    nginx -t || true
    die "nginx -t failed"
fi

systemctl reload nginx || systemctl restart nginx
log "vhost installed and nginx reloaded"

# ── verification ────────────────────────────────────────────────────────────
log "verifying $DOMAIN"
API_BODY="$(mktemp)"
trap 'rm -f "$RENDERED" "$API_BODY"' EXIT

HTTP_CODE="$(curl -sS -o "$API_BODY" -w '%{http_code}' \
    -H 'Accept: application/json' \
    "https://$DOMAIN/api/v1/tenant/by-domain?domain=$DOMAIN" || echo 000)"

if [ "$HTTP_CODE" = "200" ] && head -c 1 "$API_BODY" | grep -q '{'; then
    log "OK  /api/v1/tenant/by-domain -> 200 application/json"
    head -c 200 "$API_BODY"; printf '\n'
else
    warn "/api/v1/tenant/by-domain -> HTTP $HTTP_CODE (not JSON: the API is not served by Laravel on this origin)"
    head -c 200 "$API_BODY"; printf '\n'
    exit 1
fi

HOME_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "https://$DOMAIN/" || echo 000)"
log "OK  / -> HTTP $HOME_CODE"

log "done for $DOMAIN"
