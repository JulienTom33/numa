# Sécurité

## Secrets

- Aucun secret, clé API, clé privée ou token n'est commité dans le dépôt, sous quelque forme que ce soit (fichier `.env` commité, valeur en dur dans le code, fixture de test).
- Les clés sensibles (clé secrète Supabase, API astrologique, IA) restent côté serveur uniquement : secrets des Edge Functions (`supabase secrets set`), jamais une variable `VITE_*`.
- Une Edge Function n'exécute rien avant d'avoir authentifié l'appelant (`createHandler`) ; les erreurs renvoyées au client ne contiennent jamais de détail interne (`errorResponse`).
- CORS des fonctions limité aux origines de l'app (`ALLOWED_ORIGINS`), jamais `*`.
- Avant tout commit, vérifier le contenu des fichiers ajoutés, même si le nom de fichier semble anodin.

## Données personnelles

- Données utilisateur (date/heure/lieu de naissance, lectures générées) protégées par RLS. Voir `supabase.md`.
- Pas de log de données personnelles en clair.
- Pas de transmission de données personnelles à un service tiers non explicitement validé pour cet usage.

## Rate limiting

- Les appels aux API externes coûteuses (astrologie, IA) sont soumis à rate limiting côté serveur (dans l'Edge Function, avant l'appel externe) pour éviter abus et dérive de coût.
- Module `supabase/functions/_shared/rateLimit.ts` : compteur à fenêtre fixe par `user_id` (table `rate_limits`, RPC `consume_rate_limit` réservée à `service_role`), consommé avant tout traitement sur `chat` (POST, comptes anonymes ou non), `geocode`, `natal-chart`, `current-sky` et `ephemeris`. Limites par défaut dans `RATE_LIMITS` (10 requêtes/min pour `chat`, 20 à 30 pour les autres). Dépassement : HTTP 429, code `rate_limit_exceeded`.
- Plafond global quotidien d'appels IA (clé `ai:global`, fenêtre de 24 h UTC) vérifié dans `chat` juste avant l'appel au fournisseur, donc après la réservation de quota : un refus libère la réservation et ne décompte aucune question. Valeur par défaut 1000, ajustable par le secret `AI_DAILY_LIMIT`. Dépassement : HTTP 429, code `ai_daily_limit_exceeded`.
- Une erreur du compteur (RPC en échec) refuse la requête (500) : le rate limiting échoue fermé.
- Un quota ou une limite n'est jamais vérifié uniquement côté client : le compteur est lu et incrémenté par la fonction, dans le même appel que l'action limitée.

## Logs

- Logs applicatifs sans données personnelles ni secrets.
- Logs d'erreur suffisamment détaillés pour debug (stack, contexte technique) sans contenu utilisateur sensible.
