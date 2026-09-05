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

# raw.githubusercontent.com sits behind a CDN that caches for a few minutes, so a
# freshly pushed file can come back stale. CB busts that cache per run.
RAW=https://raw.githubusercontent.com/AnatoliiNovyk/CORE64-Records/main
CB="?cb=$(date +%s)"
DB=supabase-db-u1u6nno8jxtc1tsqv1arokts
EDGE=supabase-edge-functions-u1u6nno8jxtc1tsqv1arokts
FNDIR=/data/coolify/services/supabase/volumes/functions/submit-contact
KONG=https://supabasekong.169.58.250.236.sslip.io

echo "== 1/4 applying SQL migration =="
curl -fsSL "$RAW/supabase/migrations/20260905120000_restore_storage_rls_and_contact_rate_limits.sql$CB" \
  | docker exec -i "$DB" psql -v ON_ERROR_STOP=1 -U postgres -d postgres

echo "== 2/4 deploying submit-contact edge function =="
mkdir -p "$FNDIR"
curl -fsSL "$RAW/supabase/functions/submit-contact/index.ts$CB" -o "$FNDIR/index.ts"
wc -l "$FNDIR/index.ts"

echo "== 3/4 restarting edge runtime =="
docker restart "$EDGE" >/dev/null
sleep 8

echo "== 4/4 verification =="
q() { docker exec -i "$DB" psql -U postgres -d postgres -tAc "$1"; }
echo -n "is_admin() is real ................. "; q "select case when prosrc like '%admin_users%' then 'yes' else 'STUB' end from pg_proc where proname='is_admin'"
echo -n "contact_rate_limits exists ......... "; q "select coalesce(to_regclass('public.contact_rate_limits')::text,'MISSING')"
echo -n "public policies on contact_messages . "; q "select count(*) from pg_policies where tablename='contact_messages' and roles::text like '%public%'"
echo -n "permissive storage policies left ... "; q "select count(*) from pg_policies where schemaname='storage' and policyname like 'Allow all%'"
echo -n "admin storage policies present ..... "; q "select count(*) from pg_policies where schemaname='storage' and policyname in ('admin_insert_media','admin_update_media','admin_delete_media')"
echo -n "submit-contact endpoint ............ "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/submit-contact"
echo -n "hello endpoint (control) ........... "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/hello"

echo
echo "Expected: table present, 0 public policies on contact_messages, 0 permissive storage"
echo "policies, 3 admin media policies, submit-contact 200, hello 200."
