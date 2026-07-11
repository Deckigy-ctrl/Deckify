#!/usr/bin/env bash
# One-command finish for the monitoring setup (see .github/workflows/monitor.yml
# and app/api/monitor/route.ts). Interactive: prompts once for the Resend API
# key, walks Vercel login if needed, then wires GitHub + Vercel, redeploys,
# and fires a test digest. UptimeRobot signup remains manual.
set -euo pipefail
cd "$(dirname "$0")/.."

MONITOR_SECRET=$(grep '^MONITOR_SECRET=' .env.local | cut -d= -f2-)
ALERT_EMAIL=$(grep '^ALERT_EMAIL=' .env.local | cut -d= -f2-)
if [ -z "$MONITOR_SECRET" ] || [ -z "$ALERT_EMAIL" ]; then
  echo "MONITOR_SECRET / ALERT_EMAIL missing from .env.local — aborting." >&2
  exit 1
fi

echo "== 1/6  Resend API key"
read -rsp "Paste your Resend API key (re_...), or press Enter if it's already set everywhere: " RESEND_KEY
echo

if [ -n "$RESEND_KEY" ]; then
  echo "== 2/6  Setting GitHub Actions secret RESEND_API_KEY"
  gh secret set RESEND_API_KEY --body "$RESEND_KEY"
else
  echo "== 2/6  Skipped GitHub secret (verify with: gh secret list)"
fi

echo "== 3/6  Vercel login + project link (follow the interactive prompts)"
npx -y vercel@latest whoami >/dev/null 2>&1 || npx -y vercel@latest login
[ -f .vercel/project.json ] || npx -y vercel@latest link

# Replace-or-create a production env var, value via stdin.
add_env() {
  npx -y vercel@latest env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | npx -y vercel@latest env add "$1" production
}

echo "== 4/6  Setting Vercel production env vars"
add_env MONITOR_SECRET "$MONITOR_SECRET"
add_env ALERT_EMAIL "$ALERT_EMAIL"
if [ -n "$RESEND_KEY" ]; then
  add_env RESEND_API_KEY "$RESEND_KEY"
fi

echo "== 5/6  Redeploying so the env vars take effect"
git commit --allow-empty -m "chore: redeploy to apply monitoring env vars"
git push origin main

echo "    Waiting for the deploy to come up with the new env (up to ~10 min)..."
CODE=""
for i in $(seq 1 40); do
  sleep 15
  CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 \
    -H "Authorization: Bearer $MONITOR_SECRET" \
    https://deckify-one.vercel.app/api/monitor || true)
  echo "    probe $i: HTTP $CODE"
  [ "$CODE" = "200" ] && break
done
if [ "$CODE" != "200" ]; then
  echo "Deploy didn't pick up the env vars in time — check the Vercel dashboard, then re-run this script." >&2
  exit 1
fi

echo "== 6/6  Firing a test digest via GitHub Actions"
gh workflow run monitor.yml -f mode=digest

echo
echo "Done. Expect a 'Deckify daily' email at $ALERT_EMAIL within ~2 minutes."
echo "Last manual step: UptimeRobot — uptimerobot.com -> Add New Monitor -> type Keyword,"
echo "URL https://deckify-one.vercel.app, keyword 'Deckify', alert when NOT exists, 5-min interval."
