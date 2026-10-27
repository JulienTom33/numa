# Sécurité

## Secrets

- Aucun secret, clé API, clé privée ou token n'est commité dans le dépôt, sous quelque forme que ce soit (fichier `.env` commité, valeur en dur dans le code, fixture de test).
- Les clés sensibles (clé secrète Supabase, API astrologique, IA) restent côté serveur uniquement : secrets des Edge Functions (`supabase secrets set`), jamais une variable `VITE_*`.
- Une Edge Function n'exécute rien avant d'avoir authentifié l'appelant (`createHandler`) ; les erreurs renvoyées au client ne contiennent jamais de détail interne (`errorResponse`).
- CORS des fonctions limité aux origines de l'app (`ALLOWED_ORIGINS`), jamais `*`.
- Avant tout commit, vérifier le contenu des fichiers ajoutés, même si le nom de fichier semble anodin.

## Données personnelles

- Données utilisateur (date/heure/lieu de naissance, lectures générées) protégées par RLS. Voir `supabase.md`.
- Suppression en libre-service (#33) : une conversation est supprimée par l'utilisateur (policy RLS `conversations_delete_own`, ses messages partent en cascade). Le compte est supprimé par l'Edge Function `delete-account` (POST, authentifiée, rate limitée à 3 requêtes/min), qui appelle `auth.admin.deleteUser` avec le client `service_role` côté serveur uniquement. Les clés étrangères `on delete cascade` effacent profil, données de naissance, thèmes, horoscopes, conversations, messages et compteurs d'usage. Les lignes `rate_limits` (clé `<fonction>:<user_id>`, sans clé étrangère) ne partent pas en cascade : `delete-account` les purge après une suppression réussie (un échec de purge est journalisé sans donnée personnelle et n'invalide pas la suppression). Le client confirme explicitement (saisie d'un mot), termine la session puis vide son cache. En cas d'erreur, le compte est conservé et l'erreur signalée. La politique de confidentialité (`legal.json`) décrit cette suppression.
- Pas de log de données personnelles en clair.
- Pas de transmission de données personnelles à un service tiers non explicitement validé pour cet usage.

## Rate limiting

- Les appels aux API externes coûteuses (astrologie, IA) sont soumis à rate limiting côté serveur (dans l'Edge Function, avant l'appel externe) pour éviter abus et dérive de coût.
- Module `supabase/functions/_shared/rateLimit.ts` : compteur à fenêtre fixe par `user_id` (table `rate_limits`, RPC `consume_rate_limit` réservée à `service_role`), consommé avant tout traitement sur `chat` (POST, comptes anonymes ou non), `geocode`, `natal-chart`, `current-sky`, `ephemeris` et `delete-account`. Limites par défaut dans `RATE_LIMITS` (10 requêtes/min pour `chat`, 20 à 30 pour les autres) ; `delete-account` a sa propre règle (3 requêtes/min). Dépassement : HTTP 429, code `rate_limit_exceeded`.
- Plafond global quotidien d'appels IA (clé `ai:global`, fenêtre de 24 h UTC) vérifié dans `chat` juste avant l'appel au fournisseur, donc après la réservation de quota : un refus libère la réservation et ne décompte aucune question. Valeur par défaut 1000, ajustable par le secret `AI_DAILY_LIMIT`. Dépassement : HTTP 429, code `ai_daily_limit_exceeded`.
- Une erreur du compteur (RPC en échec) refuse la requête (500) : le rate limiting échoue fermé.
- Un quota ou une limite n'est jamais vérifié uniquement côté client : le compteur est lu et incrémenté par la fonction, dans le même appel que l'action limitée.

## Logs

- Logs applicatifs sans données personnelles ni secrets.
- Logs d'erreur suffisamment détaillés pour debug (stack, contexte technique) sans contenu utilisateur sensible.

## Appels externes

- Tout appel sortant (fournisseurs IA, géocodage) passe par `fetchExternal` (`supabase/functions/_shared/external.ts`) : timeout obligatoire, erreurs 4xx/5xx/429 classées, retry borné aux erreurs transitoires (timeout, réseau, 5xx).
- Les réponses d'erreur portent `error.correlationId`, également journalisé côté serveur ; le journal ne contient que service, nature de l'échec et statut (jamais URL, en-têtes, corps ni clé).
- Une panne de la chaîne IA renvoie `503 ai_unavailable` (pas de réponse dégradée).

## Tests d'isolation des données

Objectif : aucun utilisateur n'accède aux données d'un autre (issue #35).

Couverture SQL (pgTAP, `supabase/tests/database/`) :

| Fichier | Couvre |
|---|---|
| `rls_policies.test.sql` | lecture isolée A/B sur les 7 tables historiques, quelques écritures croisées, rôle `anon` en lecture |
| `cross_user_isolation.test.sql` | toutes les tables sensibles (profiles, birth_data, natal_charts, daily_horoscopes, conversations, messages, usage_counters, onboarding_drafts, question_reservations, rate_limits) : lecture par identifiant modifié, insert/update/delete au nom d'un autre utilisateur, transfert de ligne vers un autre `user_id`, jeton sans identité, rôle `anon` en écriture et en RPC, RLS activée sur toute table `public`, absence de policy `true`, vérification hors RLS que les données de B sont intactes |
| `question_quota`, `chat_answer_traceability`, `daily_horoscope_traceability`, `natal_chart_cache`, `rate_limits`, `onboarding` | écritures réservées au serveur (`service_role`), fonctions `security definer` non exécutables par le client |

Couverture Edge Functions (Deno) : `chat/userContext_test.ts` et `horoscope/userContext_test.ts` prouvent que les accès (quota, conversation, thème, horoscope, rate limit) n'utilisent que `caller.userId` issu du jeton, jamais un identifiant du corps ou de la requête ; `delete-account` est couverte par `deleteAccount_test.ts`.

Lancer :

```bash
supabase start
supabase db reset
supabase test db
cd supabase/functions && deno task test
```

Résultats : aucun accès croisé ne passe ; aucune faille RLS n'a été identifiée lors de cette revue du schéma. Les tests pgTAP sont exécutés par la CI ; mettre à jour cette section si un test révèle un écart.
