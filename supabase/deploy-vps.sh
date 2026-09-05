#!/bin/bash
# Bring the self-hosted CORE64 Records stack in line with this repository.
# Run ON THE VPS as root. Idempotent — safe to re-run.
#
#   1) applies every migration not yet recorded in
#      supabase_migrations.schema_migrations, oldest first, recording each
#   2) deploys the submit-contact edge function into the functions volume
#   3) restarts the edge runtime and verifies the result
#
# Contains no credentials: it pulls everything from the public repository.
#
# The database was originally populated from a dump rather than by running
# these files, so the history table was baselined with all migrations that
# existed on 2026-09-05 marked as applied. Several of them are destructive on
# a populated database — 20260801013535 drops every table — so nothing already
# reflected in the schema may ever be replayed.
set -euo pipefail

# The raw.githubusercontent CDN caches for minutes and ignores cache-busting query
# strings, so a freshly pushed file comes back stale. The contents API is not cached.
API=https://api.github.com/repos/AnatoliiNovyk/CORE64-Records/contents
GH=(-fsSL -H "Accept: application/vnd.github.raw")
GHJSON=(-fsSL -H "Accept: application/vnd.github+json")
DB=supabase-db-u1u6nno8jxtc1tsqv1arokts
EDGE=supabase-edge-functions-u1u6nno8jxtc1tsqv1arokts
FNDIR=/data/coolify/services/supabase/volumes/functions/submit-contact
KONG=https://supabasekong.169.58.250.236.sslip.io

run_sql() { docker exec -i "$DB" psql -v ON_ERROR_STOP=1 -U postgres -d postgres; }
q()       { docker exec -i "$DB" psql -U postgres -d postgres -tAc "$1"; }

echo "== 1/4 migrations =="
run_sql <<'SQL'
CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
  version     text PRIMARY KEY,
  name        text,
  statements  text[],
  inserted_at timestamptz DEFAULT now()
);
SQL

applied=0
skipped=0
for file in $(curl "${GHJSON[@]}" "$API/supabase/migrations?ref=main" \
                | jq -r '.[] | select(.name | endswith(".sql")) | .name' | sort); do
  version=${file%%_*}
  name=${file#*_}; name=${name%.sql}

  if [ -n "$(q "SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '$version'")" ]; then
    skipped=$((skipped + 1))
    continue
  fi

  echo "   applying $file"
  curl "${GH[@]}" "$API/supabase/migrations/$file?ref=main" | run_sql
  q "INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('$version', '$name')" >/dev/null
  applied=$((applied + 1))
done
echo "   applied $applied, already recorded $skipped"

echo "== 2/4 submit-contact edge function =="
mkdir -p "$FNDIR"
curl "${GH[@]}" "$API/supabase/functions/submit-contact/index.ts?ref=main" -o "$FNDIR/index.ts"
wc -l "$FNDIR/index.ts"

echo "== 3/4 restarting edge runtime =="
docker restart "$EDGE" >/dev/null
sleep 8

echo "== 4/4 verification =="
echo -n "migrations recorded ................ "; q "SELECT count(*) FROM supabase_migrations.schema_migrations"
echo -n "is_admin() is real ................. "; q "SELECT CASE WHEN prosrc LIKE '%admin_users%' THEN 'yes' ELSE 'STUB' END FROM pg_proc WHERE proname = 'is_admin'"
echo -n "contact_rate_limits exists ......... "; q "SELECT coalesce(to_regclass('public.contact_rate_limits')::text, 'MISSING')"
echo -n "public policies on contact_messages  "; q "SELECT count(*) FROM pg_policies WHERE tablename = 'contact_messages' AND roles::text LIKE '%public%'"
echo -n "permissive storage policies left ... "; q "SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname LIKE 'Allow all%'"
echo -n "admin storage policies present ..... "; q "SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND policyname IN ('admin_insert_media','admin_update_media','admin_delete_media')"
echo -n "submit-contact endpoint ............ "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/submit-contact"
echo -n "hello endpoint (control) ........... "; curl -s -o /dev/null -w '%{http_code}\n' -X OPTIONS "$KONG/functions/v1/hello"

echo
echo "Expected: is_admin yes, table present, 0 public policies on contact_messages,"
echo "0 permissive storage policies, 3 admin media policies, both endpoints 200."
