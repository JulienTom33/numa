# Runbook : monitoring et logs

Surveillance des erreurs et des performances du MVP, sans service externe supplémentaire : les Edge Functions écrivent des logs JSON structurés lus dans le tableau de bord Supabase (Logs, Edge Functions). Pour le déploiement et les autres sources de logs, voir `deploiement-restauration.md` (section 5).

## 1. Format des logs

Une ligne JSON par événement (`supabase/functions/_shared/logger.ts`). Champs communs : `ts` (ISO 8601), `level` (`info`, `warn`, `error`), `event`.

| Événement | Niveau | Champs | Signification |
|---|---|---|---|
| `request_completed` | info, ou error si statut >= 500 | `function`, `method`, `request_id`, `status`, `code`, `latency_ms` | une ligne par requête (hors préflight CORS) |
| `auth_failure` | warn | idem | statut 401 : jeton absent (`unauthenticated`) ou invalide (`invalid_token`) |
| `quota_rejected` | warn | idem | `rate_limit_exceeded`, `ai_daily_limit_exceeded` ou `question_quota_exceeded` (429) |
| `ai_provider_failure` | error | `provider_kind`, `service`, `kind` | échec d'un fournisseur IA de la chaîne (chat, horoscopes), avant bascule |
| `provider_error` | error | `error_type` | exception inattendue pendant la génération d'une réponse du chat (502) |
| `rate_limits_purge_failed` | error | `function` | purge des compteurs de rate limit échouée après suppression d'un compte |
| `external_failure` | error | `provider_kind`, `service`, `kind`, `status`, `attempt`, `latency_ms` | échec d'un appel sortant, un événement par tentative |
| `http_error` | error | `code`, `correlation_id` | erreur attendue de statut >= 500 (ex. `ai_unavailable`) |
| `unexpected_error` | error | `error_type`, `correlation_id` | exception non prévue (réponse 500 `internal_error`) |

Identifiant technique : `request_id` d'un `request_completed` est identique au `correlation_id` des erreurs de la même requête et au `error.correlationId` renvoyé au client. Pour analyser un incident signalé, demander cet identifiant (affiché dans le message d'erreur) et le rechercher dans les logs.

Fournisseurs différenciables : `provider_kind` vaut `ai` (chaîne de fournisseurs IA, `service` = identifiant du fournisseur), `geocoding` (`service` = `open-meteo`) ou `astrology`. Le calcul astrologique actuel est local (Astronomy Engine) et ne produit pas d'appel sortant ; `provider_kind: astrology` est réservé à une future API externe.

`kind` : `timeout`, `rate_limited`, `http_error`, `network_error`. Un `rate_limited` ou un statut 429 sur `provider_kind: ai` indique un quota fournisseur atteint.

Aucune donnée personnelle : ni identifiant d'utilisateur, ni jeton, ni URL, ni corps de requête, ni contenu de question ou de lecture. Les champs sont des valeurs scalaires choisies explicitement. Voir `docs/claude/security.md`.

## 2. Lire les logs

1. Tableau de bord Supabase, Logs, Edge Functions, choisir la fonction (`chat`, `geocode`, `natal-chart`, `horoscope`, `horoscope-weekly`, `current-sky`, `ephemeris`, `delete-account`, `whoami`).
2. Chercher par texte : `"event":"external_failure"`, `"event":"auth_failure"`, `"event":"quota_rejected"`, ou un `request_id` précis.
3. Filtrer par fournisseur : `"provider_kind":"ai"` ou `"provider_kind":"geocoding"`.
4. Latence : lire `latency_ms` des `request_completed` ; comparer à la médiane habituelle de la fonction.

En local : `supabase functions serve` affiche les mêmes lignes dans le terminal.

## 3. Seuils d'alerte

Il n'y a pas d'alerting automatique dans le MVP : relever ces seuils à la main (au moins quotidiennement pendant la bêta, après chaque déploiement) sur une fenêtre de 15 minutes. Une alerte automatique pourra être ajoutée plus tard sur ces mêmes événements.

| Signal | Seuil | Gravité | Action |
|---|---|---|---|
| `unexpected_error` | au moins 1, ou plus de 1 % des requêtes | critique | enquêter via `correlation_id` ; envisager le retour arrière (`deploiement-restauration.md`, 8.3) |
| `request_completed` statut >= 500 | plus de 5 % des requêtes d'une fonction sur 15 min | critique | identifier la cause (fournisseur ou code), retour arrière si lié au dernier déploiement |
| `external_failure` `provider_kind: ai` | plus de 5 en 15 min, ou `http_error` 5xx en continu | critique | vérifier le fournisseur, la chaîne de bascule, les clés ; `ai_unavailable` en cours = incident |
| `external_failure` `provider_kind: geocoding` | plus de 10 en 15 min | majeur | saisie de lieu dégradée ; vérifier Open-Meteo |
| `external_failure` `kind: rate_limited` (IA) | au moins 3 en 15 min | majeur | quota fournisseur proche ou atteint ; voir `docs/research/fournisseurs-ia.md` |
| `quota_rejected` `ai_daily_limit_exceeded` | au moins 1 | majeur | plafond global atteint : abus ou succès ; relever `AI_DAILY_LIMIT` si justifié |
| `quota_rejected` `rate_limit_exceeded` | plus de 50 en 15 min | mineur | abus probable ; surveiller, pas de donnée personnelle journalisée |
| `auth_failure` | plus de 30 en 15 min | majeur | jeton expiré en masse, clé JWT tournée ou attaque ; vérifier la configuration Auth |
| `latency_ms` p95 d'une fonction | `chat` > 20 s, autres > 5 s | majeur | vérifier la latence fournisseur (`external_failure`, `timeout`) |

Une alerte critique ouvre un incident : noter l'heure, le `request_id` d'exemple et la décision (correctif ou retour arrière) dans le ticket GitHub correspondant.

## 4. Erreurs frontend et migration anonyme

- Aucun point d'entrée de collecte n'existe côté client : les erreurs frontend ne sont pas encore remontées. Une capture dans `src/main.tsx` renvoyant vers une Edge Function de collecte reste à créer (suivi à ouvrir).
- Échecs de migration d'un compte anonyme : l'opération se fait via Supabase Auth et n'a pas de fonction dédiée. Elle se lit dans Logs, Auth du tableau de bord Supabase. Seuil : plus de 3 échecs en 15 min = majeur.
- Échecs d'authentification serveur : événement `auth_failure` ci-dessus.

## 5. Règles pour ajouter un log

- Utiliser `logEvent` (jamais `console.*` direct), avec des champs scalaires nommés en `snake_case`.
- Interdit : identifiant utilisateur, e-mail, jeton, URL appelée, contenu de question ou de lecture, date, heure ou lieu de naissance, message d'erreur brut d'un tiers.
- Toute nouvelle fonction passe `functionName` à `createHandler`.
