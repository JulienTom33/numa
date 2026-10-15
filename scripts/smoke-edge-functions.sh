#!/usr/bin/env bash
# Vérifie de bout en bout les Edge Functions sur la stack Supabase locale (supabase start) :
# une session anonyme réelle appelle `whoami`, et un appel sans JWT doit être refusé.
set -euo pipefail

eval "$(supabase status -o env)"
FUNCTION_URL="$API_URL/functions/v1/whoami"
READY_ATTEMPTS=60
READY_DELAY_SECONDS=2
SERVE_LOG=/tmp/functions-serve.log

fail() {
  echo "$1" >&2
  cat "$SERVE_LOG" >&2
  exit 1
}

supabase functions serve >"$SERVE_LOG" 2>&1 &
SERVE_PID=$!
trap 'kill "$SERVE_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 "$READY_ATTEMPTS"); do
  status=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL" || true)
  [[ "$status" != "000" && "$status" != "502" && "$status" != "503" ]] && break
  sleep "$READY_DELAY_SECONDS"
done

unauthenticated=$(curl -s -o /dev/null -w "%{http_code}" -H "apikey: $ANON_KEY" "$FUNCTION_URL")
[[ "$unauthenticated" == "401" ]] || fail "Appel sans JWT : 401 attendu, reçu $unauthenticated"

access_token=$(curl -sf -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" -d '{}' | jq -r .access_token)

response=$(curl -sf "$FUNCTION_URL" -H "apikey: $ANON_KEY" -H "Authorization: Bearer $access_token")
echo "$response" | jq -e '.isAnonymous == true and (.userId | length > 0)' >/dev/null ||
  fail "Réponse inattendue de whoami : $response"

echo "Edge Functions OK : session anonyme authentifiée, appel sans JWT refusé."
