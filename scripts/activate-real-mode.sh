#!/usr/bin/env bash
# WasiAgentShop · Activate real mode on Vercel prod
# Run this AFTER scripts/register-agents-in-v2.sql has succeeded.
#
# What this does:
#   1. Flips NEXT_PUBLIC_DEMO_MODE=false in Vercel env (prod/preview/dev)
#   2. Triggers a redeploy to apply
#
# Prerequisite env vars in current shell:
#   - VERCEL_TOKEN (or pass via -t flag)

set -euo pipefail

VERCEL_TOKEN="${VERCEL_TOKEN:-$(grep '^VERCEL_TOKEN=' /home/ferdev/.openclaw/workspace/wasiai-a2a/.env | cut -d= -f2-)}"
TEAM_ID="team_TULy0a3V6xlsEkKA2MXzALzf"
PROJECT_ID="prj_4W3zGoIzXCQ1yhz10ptt2aggQMUW"

if [ -z "$VERCEL_TOKEN" ]; then
  echo "ERROR: VERCEL_TOKEN not set"
  exit 1
fi

echo "Flipping NEXT_PUBLIC_DEMO_MODE=false on Vercel project $PROJECT_ID..."

# List existing env, find DEMO_MODE id, delete it, recreate with new value
for ENV in production preview development; do
  curl -s -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID&upsert=true" \
    -H "Authorization: Bearer $VERCEL_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"key\":\"NEXT_PUBLIC_DEMO_MODE\",\"value\":\"false\",\"type\":\"plain\",\"target\":[\"$ENV\"]}" \
    > /dev/null
  echo "  ✓ $ENV → NEXT_PUBLIC_DEMO_MODE=false"
done

echo
echo "Triggering Vercel redeploy..."
cd "$(dirname "$0")/.."
vercel --prod --yes --token "$VERCEL_TOKEN" 2>&1 | tail -3

echo
echo "Real-mode activated. Test:"
echo "  curl https://wasiai-agentshop.vercel.app/demo"
echo
echo "If the pipeline fails with INSUFFICIENT_BUDGET on chain 2368:"
echo "  Increase the A2A_KEY budget via Supabase RPC register_a2a_key_deposit(...)"
echo "  See scripts/register-agents-in-v2.sql for verification queries."
