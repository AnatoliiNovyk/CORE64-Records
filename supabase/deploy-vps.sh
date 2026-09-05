#!/bin/bash
# Bring the self-hosted CORE64 stack in line with this repository.
# Run ON THE VPS as root. Idempotent — safe to re-run.
#
#   1) applies 20260905120000 (contact_rate_limits, contact_messages hardening,
#      storage RLS restore)
#   2) deploys the submit-contact edge function into the functions volume
#   3) restarts the edge runtime and verifies the result
#
# Contains no credentials: it pulls both files from the public repository.
set -euo pipefail

RAW=https://raw.githubusercontent.com/AnatoliiNovyk/CORE64-Records/main
DB=supabase-db-u1u6nno8jxtc1tsqv1arokts
EDGE=supabase-edge-functions-u1u6nno8jxtc1tsqv1arokts
FNDIR=/data/coolify/services/supabase/volumes/functions/submit-contact
KONG=https://supabasekong.169.58.250.236.sslip.io

echo "== 1/4 applying SQL migration =="
curl -fsSL "$RAW/supabase/migrations/20260905120000_restore_storage_rls_and_contact_rate_limits.sql" \
  | docker exec -i "$DB" psql -v ON_ERROR_STOP=1 -U postgres -d postgres

echo "== 2/4 deploying submit-contact edge function =="
mkdir -p "$FNDIR"
curl -fsSL "$RAW/supabase/functions/submit-contact/index.ts" -o "$FNDIR/index.ts"
wc -l "$FNDIR/index.ts"

echo "== 3/4 restarting edge runtime =="
docker restart "$EDGE" >/dev/null
sleep 8

echo "== 4/4 verification =="
q() { docker exec -i "$DB" psql -U postgres -d postgres -tAc "$1"; }
echo -n "contact_rate_limits exists ......... "; q "select coalesce(to_regclass('public.contact_rate_limits')::text,'MISSING')"
echo -n "anon INSERT policies remaining ..... "; q "select count(*) from pg_policies where tablename='contact_messages' and cmd='INSERT'"
echo -n "permissive storage policies left ... "; q "select count(*) from pg_policies where schemaname='storage' and policyname like 'Allow all%'"
echo -n "admin storage policies present ..... "; q "select count(*) from pg_policies where schemaname='storage' and policyname like 'admin_%_media'"
echo -n "submit-contact endpoint ............ "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/submit-contact"
echo -n "hello endpoint (control) ........... "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/hello"

echo
echo "Expected: table present, 0 anon INSERT policies, 0 permissive storage"
echo "policies, 4 admin media policies, submit-contact 200, hello 200."
