#!/usr/bin/env bash
# Vérifie de bout en bout les Edge Functions sur la stack Supabase locale (supabase start) :
# une session anonyme réelle appelle `whoami`, un appel sans JWT doit être refusé, et `chat`
# applique le quota de deux questions anonymes côté serveur.
set -euo pipefail

eval "$(supabase status -o env)"
API_KEY="${PUBLISHABLE_KEY:-$ANON_KEY}"
FUNCTION_URL="$API_URL/functions/v1/whoami"
READY_ATTEMPTS=60
READY_DELAY_SECONDS=2
SERVE_LOG=/tmp/functions-serve.log
BODY_FILE=/tmp/smoke-body.json

fail() {
  echo "$1" >&2
  echo "--- supabase functions serve ---" >&2
  cat "$SERVE_LOG" >&2
  exit 1
}

# Écrit le corps dans $BODY_FILE et renvoie le code HTTP, sans échouer sur un 4xx/5xx.
request() {
  curl -s -o "$BODY_FILE" -w "%{http_code}" "$@" || echo "000"
}

supabase functions serve >"$SERVE_LOG" 2>&1 &
SERVE_PID=$!
trap 'kill "$SERVE_PID" 2>/dev/null || true' EXIT

# La fonction est prête quand elle répond 401 à un appel sans JWT (avant : 000, 404, 502, 503).
status="000"
for _ in $(seq 1 "$READY_ATTEMPTS"); do
  status=$(request -H "apikey: $API_KEY" "$FUNCTION_URL")
  [[ "$status" == "401" ]] && break
  sleep "$READY_DELAY_SECONDS"
done
[[ "$status" == "401" ]] || fail "Appel sans JWT : 401 attendu, reçu $status ($(cat "$BODY_FILE"))"

status=$(request -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $API_KEY" -H "Content-Type: application/json" -d '{}')
[[ "$status" == "200" ]] || fail "Session anonyme : 200 attendu, reçu $status ($(cat "$BODY_FILE"))"
access_token=$(jq -r .access_token "$BODY_FILE")

status=$(request "$FUNCTION_URL" -H "apikey: $API_KEY" -H "Authorization: Bearer $access_token")
[[ "$status" == "200" ]] || fail "whoami : 200 attendu, reçu $status ($(cat "$BODY_FILE"))"
jq -e '.isAnonymous == true and (.userId | length > 0)' "$BODY_FILE" >/dev/null ||
  fail "Réponse inattendue de whoami : $(cat "$BODY_FILE")"

CHAT_URL="$API_URL/functions/v1/chat"
AUTH=(-H "apikey: $API_KEY" -H "Authorization: Bearer $access_token")

status=$(request "$CHAT_URL" "${AUTH[@]}")
[[ "$status" == "200" ]] || fail "chat GET : 200 attendu, reçu $status ($(cat "$BODY_FILE"))"
jq -e '.quota.remaining == 2' "$BODY_FILE" >/dev/null || fail "Quota initial inattendu : $(cat "$BODY_FILE")"

for expected_remaining in 1 0; do
  status=$(request -X POST "$CHAT_URL" "${AUTH[@]}" -H "Content-Type: application/json"     -d '{"question":"Test de bout en bout"}')
  [[ "$status" == "200" ]] || fail "chat POST : 200 attendu, reçu $status ($(cat "$BODY_FILE"))"
  jq -e --argjson r "$expected_remaining" '.quota.remaining == $r and (.answer | length > 0)'     "$BODY_FILE" >/dev/null || fail "Réponse inattendue de chat : $(cat "$BODY_FILE")"
done

status=$(request -X POST "$CHAT_URL" "${AUTH[@]}" -H "Content-Type: application/json"   -d '{"question":"Troisième question"}')
[[ "$status" == "429" ]] || fail "3e question : 429 attendu, reçu $status ($(cat "$BODY_FILE"))"

echo "Edge Functions OK : session anonyme authentifiée, appel sans JWT refusé, quota appliqué."
