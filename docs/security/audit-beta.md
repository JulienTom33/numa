# Audit de sécurité avant bêta (#55)

Date : 2026-10-27. Base : `master` au commit `3fe2e9e`. Méthode : revue statique du dépôt (migrations, Edge Functions, Caddyfile, Docker, workflows, client) et `npm audit --omit=dev`. Aucun scan actif, aucune requête vers une cible distante, aucun secret ni donnée personnelle consulté ou reproduit.

Limites : les réglages réels du dashboard Supabase (Auth, secrets des fonctions) et du serveur OVH ne sont pas lisibles depuis le dépôt ; ils sont listés en section « À vérifier hors dépôt ».

## Synthèse

| Sévérité | Nombre | Détail |
|---|---|---|
| Critique | 0 | Aucun secret commité, aucun accès croisé, aucune clé serveur côté client. |
| Élevée | 0 | |
| Moyenne | 3 | F-01, F-02, F-03 |
| Faible | 6 | F-04 à F-09 |
| Information | 3 | F-10 à F-12 |

Aucun correctif de code n'a été fait dans cette PR : les constats sont des propositions de tickets.

## Résultats par domaine

### Secrets et variables d'environnement : conforme

- Aucun `.env`, clé ou certificat suivi par git (`git ls-files`). `.env.example` ne contient que des placeholders.
- Seules `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` existent côté client (`src/shared/supabaseClient/supabaseClient.ts:5-6`, `Dockerfile`). `deploy.yml:20-27` bloque le déploiement si la clé ne commence pas par `sb_publishable_`.
- Clé secrète Supabase et clés IA lues uniquement via `Deno.env` (`supabase/functions/_shared/supabase.ts:10-24`, `chat/config.ts` via `apiKeyEnv`).
- Les secrets CI sont passés par `secrets.*` ; `claude-review.yml` utilise une action épinglée sur un SHA.

### RLS et accès croisés : conforme

- RLS activée sur les tables `public` (profiles, birth_data, natal_charts, daily_horoscopes, conversations, messages, usage_counters, onboarding_drafts, question_reservations, rate_limits), contrôle automatisé par `cross_user_isolation.test.sql` ; policies `auth.uid() = user_id` ou jointure sur `conversations` pour `messages` (`20260914120000_initial_schema.sql`).
- Écritures sensibles retirées au client : `usage_counters` (`20261015140000`), `natal_charts` (`20261016150000:12`), `daily_horoscopes` (`20261027120000:27`), `messages` (insert limité à `conversation_id, role, content`, `role = 'user'`, `20261025120000:30-32`), `rate_limits` et `question_reservations` (`revoke all`).
- Toutes les fonctions `security definer` ont `set search_path = ''` et un `revoke execute ... from public, anon, authenticated` (quota, `record_answer`, `consume_rate_limit`, triggers de statut). `complete_onboarding` est `security invoker`, donc soumise à la RLS.
- `profiles.status` ne peut pas être forgé (trigger `derive_profile_status`).
- Les tests pgTAP (`cross_user_isolation.test.sql`, etc.) couvrent lecture, écriture, transfert de ligne et rôle `anon`.
- Contraintes de taille en base : `20261027140000_harden_messages_birth_data.sql`.

### Endpoints backend : conforme avec réserves

- Toutes les fonctions passent par `createHandler` : méthode vérifiée, JWT validé par `auth.getClaims` avant toute logique (`_shared/handler.ts:28-31`, `_shared/supabase.ts:44-48`). `verify_jwt` reste à sa valeur par défaut (activée) côté gateway.
- CORS : liste blanche `ALLOWED_ORIGINS`, jamais `*` (`_shared/cors.ts:18-22`).
- Erreurs : message générique + `correlationId`, aucun détail interne (`_shared/http.ts:19-48`).
- Identifiant de l'appelant toujours issu du jeton, jamais du corps (tests `userContext_test.ts`).
- Entrées : `chat` (longueur ≤ 500, UUID, détection de données personnelles, `chat/chat.ts:25-46`), `horoscope` (date ISO ±1 jour), `geocode` (longueur et limite bornées, `URLSearchParams`), `ephemeris` (`range.ts`).
- `AI_PROVIDER_STUB=1` désactive les fournisseurs IA (`chat/index.ts:13`, `horoscope/index.ts:12`) ; positionné uniquement dans la CI (`ci.yml:104`), voir F-08.

### Rate limiting : conforme avec réserves

- Compteur atomique en base, échec fermé, consommé avant l'appel externe sur toutes les fonctions coûteuses, plafond IA global 1000/jour. Voir F-01 pour le contournement par création de comptes anonymes.

### Injection de prompt : risque résiduel faible

- Le prompt système déclare la question comme donnée et non comme consigne (`chat/prompt.ts`, règle 6). Question bornée à 500 caractères, facteurs astrologiques issus du calcul serveur (jamais du client). La sortie est rendue par React (aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval` dans `src/`), donc pas d'XSS via la réponse IA.
- Limite connue : aucune détection de contournement du prompt ni filtrage de sortie ; voir F-07.

### Logs : conforme

- Les fonctions n'écrivent que `console.error(code, correlationId)` / nom d'erreur (`_shared/http.ts:19,31-35`), pas d'URL, en-tête, corps ni clé (`_shared/external.ts`). Aucun `console.log` dans `supabase/functions` ni `src`.
- Caddy : journal d'accès fichier avec rotation 10 Mo x 5 (`Caddyfile:16-21`) ; il contient les adresses IP des visiteurs, voir F-09.

### Suppression des données : conforme

- `delete-account` (POST, authentifiée, 3 req/min) supprime l'utilisateur via `auth.admin.deleteUser` ; cascade `on delete cascade` sur toutes les tables liées ; purge explicite de `rate_limits` ; suppression de conversation par la policy `conversations_delete_own`.

### Cookies et sessions : conforme avec réserves

- Session supabase-js stockée dans des cookies `Path=/; SameSite=Lax; Secure` en HTTPS, 400 jours (`src/shared/supabaseClient/cookieStorage.ts:22-27`). Rotation du refresh token active (`config.toml`, `enable_refresh_token_rotation = true`, `jwt_expiry = 3600`).
- Cookies non `HttpOnly` par conception (lus par le JS) : voir F-04.
- Bannière de consentement (#193) : le choix est stocké dans `sidera-cookie-consent`, le cookie de session est strictement nécessaire.

### En-têtes et CSP Caddy (#184) : conforme avec réserves

- Présents : CSP restrictive (`default-src 'self'`, `script-src 'self'`, `connect-src 'self' {$SUPABASE_URL}`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri`, `form-action`), HSTS 1 an `includeSubDomains`, `X-Content-Type-Options`, `X-Frame-Options DENY`, `Referrer-Policy`, `Permissions-Policy` (`Caddyfile:7-14`).
- `style-src 'self'` bloque les attributs `style` écrits en HTML ; l'unique usage actuel (`ProgressRing.tsx:28`) passe par le CSSOM de React et n'est pas bloqué. À valider en navigateur (F-10).
- Conteneur exécuté sous un utilisateur non root (`Dockerfile`), admin Caddy non exposé (healthcheck local).

### Réglages Auth (#185)

- `config.toml` n'est pas poussé en production (`docs/claude/supabase.md`) ; le dashboard fait foi. Valeurs locales : mot de passe ≥ 8, `enable_manual_linking`, anonymous sign-ins activés (30/h/IP), `email_sent = 2`. Voir F-02 et la checklist hors dépôt.

### Dépendances

- `npm audit --omit=dev` : 0 vulnérabilité (prod). Dépendances Deno verrouillées (`supabase/functions/deno.lock`).
- Actions GitHub (`actions/*@v4`, `supabase/setup-cli@v1` avec `version: latest`) référencées par tag : voir F-06.

## Constats

### F-01 (Moyenne) Contournement des limites par création de sessions anonymes

- Preuve : les limites sont indexées sur `user_id` (`_shared/rateLimit.ts:44-45`) et les quotas de questions aussi (`chat/quota.ts`) ; `enable_anonymous_sign_ins = true` (`supabase/config.toml:178`), 30 créations/h/IP (`:203`), pas de captcha (`config.toml:213-216`, commenté).
- Impact : un attaquant ou un utilisateur peut multiplier les identités pour dépasser quotas et limites par utilisateur, et consommer le plafond global IA de 1000 appels/jour (déni de service du chat et de l'horoscope pour tous, `rateLimit.ts:60-67`) ainsi que les quotas Open-Meteo.
- Correctif proposé : activer Cloudflare Turnstile ou hCaptcha pour les connexions anonymes (dashboard + `[auth.captcha]`, jeton transmis par `signInAnonymously`) ; ajouter un plafond IA par fenêtre plus court ou par IP côté fonction ; alerte quand `ai:global` atteint 80 %. Au minimum, surveiller la création de comptes anonymes pendant la bêta.

### F-02 (Moyenne) Réglages Auth de production non vérifiables ni versionnés

- Preuve : `deploy-supabase.yml` ne pousse que migrations, `ALLOWED_ORIGINS` et fonctions (lignes `Appliquer les migrations` à `Déployer`), pas `config.toml` ; en local `enable_confirmations = false` (`config.toml:226`), `secure_password_change = false` (`:228`), `site_url` local (`:159`).
- Impact : une dérive du dashboard (Site URL ou Redirect URLs avec `localhost`, confirmation d'email désactivée, protection contre les mots de passe divulgués absente) n'est détectée par aucun contrôle ; redirections ouvertes ou prise de compte par email non confirmé possibles.
- Correctif proposé : exécuter la checklist « hors dépôt » ci-dessous avant l'ouverture de la bêta et la consigner dans ce dossier ; envisager un job manuel qui interroge l'API de gestion Supabase (`GET /v1/projects/{ref}/config/auth`) et échoue si les valeurs attendues diffèrent ; activer `secure_password_change = true`.

### F-03 (Moyenne) Déploiement OVH non conditionné à la CI

- Preuve : `.github/workflows/deploy.yml:3-6` se déclenche sur `push` vers `master` sans dépendre du workflow `CI` (contrairement à `deploy-supabase.yml`, déclenché par `workflow_run`). Le fichier `.env` de production est écrit via un heredoc non quoté (`:50-54`), et `ssh-keyscan` récupère la clé d'hôte à chaque exécution (`:36`).
- Impact : un merge dont la CI échoue part tout de même en production ; la clé d'hôte n'est pas épinglée (attaque de l'homme du milieu possible au moment du scan) ; un secret contenant `$` ou une apostrophe backtick altérerait le `.env`.
- Correctif proposé : passer à `workflow_run` sur `CI` réussie (comme `deploy-supabase.yml`) ou exiger une branche protégée avec CI obligatoire ; stocker la clé d'hôte attendue dans un secret `SSH_KNOWN_HOSTS` ; utiliser un heredoc quoté et passer les valeurs par variables d'environnement.

### F-04 (Faible) Cookie de session lisible par le JavaScript

- Preuve : `cookieStorage.ts:22-27` (pas de `HttpOnly`, durée 400 jours).
- Impact : une XSS volerait le refresh token ; atténué par la CSP `script-src 'self'` et l'absence de sink HTML dans `src/`. La rotation du refresh token limite la réutilisation.
- Correctif proposé : conserver (limite technique de supabase-js en SPA), maintenir la CSP stricte, ajouter une règle de revue interdisant `dangerouslySetInnerHTML` et l'ajout de domaines de script ; ramener la durée au plus court acceptable pour un compte anonyme.

### F-05 (Faible) Nettoyage partiel de `rate_limits`

- Preuve : `20261025180000_rate_limits.sql:37` ne supprime que les fenêtres périmées de la clé appelée.
- Impact : les clés de comptes inactifs ne sont jamais purgées (croissance lente de la table, une ligne par clé et fenêtre).
- Correctif proposé : tâche `pg_cron` quotidienne `delete from public.rate_limits where window_start < now() - interval '2 days'`.

### F-06 (Faible) Actions GitHub non épinglées

- Preuve : `actions/checkout@v4`, `actions/setup-node@v4`, `supabase/setup-cli@v1` avec `version: latest` (`ci.yml`, `deploy*.yml`), alors que `claude-review.yml` épingle par SHA.
- Impact : risque de chaîne d'approvisionnement sur les jobs qui détiennent `SUPABASE_ACCESS_TOKEN`, `SSH_PRIVATE_KEY`.
- Correctif proposé : épingler par SHA (Dependabot pour `github-actions`), fixer la version du CLI Supabase dans les workflows de déploiement.

### F-07 (Faible) Injection de prompt : défense limitée à la consigne

- Preuve : `chat/prompt.ts` (règle 6) et `chat/questionGuard.ts` ; aucune validation de sortie.
- Impact : une question pourrait obtenir une réponse hors cadre (ton, contenu non souhaité, fuite du prompt système, qui n'est pas secret). Aucun accès à des données d'autres utilisateurs n'est possible : le contexte ne contient que les facteurs de l'appelant.
- Correctif proposé : jeu de questions adversariales dans le protocole de test IA (`docs/research/fournisseurs-ia.md`), filtre de sortie minimal (mots-clés interdits : diagnostic, certitude), séparation du rôle de la question en message distinct.

### F-08 (Faible) Interrupteur `AI_PROVIDER_STUB` actif en production par simple variable

- Preuve : `chat/index.ts:13`, `horoscope/index.ts:12`.
- Impact : si le secret est positionné par erreur en production, les utilisateurs reçoivent des réponses factices sans erreur visible.
- Correctif proposé : refuser le démarrage du stub quand `SUPABASE_URL` n'est pas local, ou journaliser une alerte au démarrage ; ajouter à la checklist de mise en production la vérification `supabase secrets list`.

### F-09 (Faible) IP dans le journal d'accès Caddy

- Preuve : `Caddyfile:16-21` (journal fichier, 5 x 10 Mo, volume `caddy_data`).
- Impact : adresses IP (donnée personnelle) conservées sans durée explicite, absentes de la liste des traitements si la politique de confidentialité ne les mentionne pas.
- Correctif proposé : mentionner les journaux d'accès et leur durée dans `legal.json`, ou masquer les IP (`log_ip`/filtre `ip_mask`) ; vérifier que `roll_keep` correspond à la durée annoncée.

### F-10 (Information) CSP à valider sur le build réel

- `style-src 'self'` sans `'unsafe-inline'` : vérifier en navigateur (console, onglet Réseau) sur l'application déployée qu'aucune violation n'apparaît (polices, styles Tailwind, Storybook exclu). Envisager `upgrade-insecure-requests` et `Cross-Origin-Opener-Policy: same-origin`. Aucune règle `Cache-Control` explicite pour `index.html` (risque de bundle périmé après déploiement).

### F-11 (Information) `rsync` envoie tout le dépôt sur le serveur

- `deploy.yml:40-46` synchronise `supabase/`, `docs/`, `e2e/` vers `/opt/numa/` alors que seul le build est nécessaire. Réduire avec un `.dockerignore`/liste d'inclusion limite la surface en cas de compromission du serveur.

### F-12 (Information) Dépendances

- `npm audit` propre à la date de l'audit ; relancer avant la bêta et activer Dependabot (npm, github-actions, docker) pour un suivi continu. Image de base `caddy:2-alpine` et `node:22-alpine` non figées par digest.

## À vérifier hors dépôt (dashboard, serveur) avant la bêta

À cocher par un humain avec accès ; ne rien consigner de secret ici.

- [ ] Auth : Site URL et Redirect URLs = domaine HTTPS de production uniquement, sans `localhost`.
- [ ] Auth : Confirm email activé ; mot de passe ≥ 8 ; Prevent use of leaked passwords activé (plan Pro) ; captcha sur anonymous sign-ins (F-01).
- [ ] Auth : limites d'envoi d'email et SMTP dédié avant l'ouverture publique.
- [ ] Secrets des fonctions : `ALLOWED_ORIGINS` = origines de production exactes ; `MISTRAL_API_KEY`, `GROQ_API_KEY` présents ; `AI_PROVIDER_STUB` absent ; `AI_DAILY_LIMIT` fixé selon le budget.
- [ ] Variable GitHub `VITE_SUPABASE_PUBLISHABLE_KEY` = clé `sb_publishable_…` (jamais `sb_secret_…`).
- [ ] Clés API du dashboard : ancienne clé `service_role` JWT révoquée ou rotée si elle a déjà été exposée.
- [ ] PITR/sauvegardes activés, accès au dashboard protégé par 2FA, environnements GitHub `staging`/`production` avec revue obligatoire.
- [ ] Branche `master` protégée : CI requise, revue requise, pas de push direct.
- [ ] Serveur OVH : accès SSH par clé uniquement, pare-feu limité à 22/80/443, mises à jour automatiques.

## Checklist de régression (à rejouer à chaque release)

1. `npm audit --omit=dev` : 0 vulnérabilité haute ou critique.
2. `git ls-files | grep -Ei '\.env$|\.pem$|\.key$'` : aucun résultat ; aucun `VITE_*` autre que `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. `supabase db reset` puis `supabase test db` : pgTAP vert (isolation A/B, RLS sur toute table `public`, aucune policy `true`, fonctions `security definer` non exécutables par `anon`/`authenticated`).
4. `cd supabase/functions && deno task test` : tests d'authentification, CORS, rate limit, `userContext_test.ts`.
5. Toute nouvelle table : RLS + policies + test d'isolation ; toute nouvelle fonction `security definer` : `set search_path = ''` + `revoke execute` + test.
6. Toute nouvelle Edge Function : passe par `createHandler`, `withRateLimit` si elle appelle un service externe, entrées validées, erreurs via `errorResponse`.
7. En-têtes de production (`curl -sI https://<domaine>`) : CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` présents (lecture passive de notre propre site uniquement).
8. Aucun `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `console.log` dans `src/` et `supabase/functions/`.
9. Checklist « hors dépôt » ci-dessus rejouée avant chaque mise en production majeure.
10. Suppression de compte : test E2E de `delete-account` vert ; `rate_limits` purgé.

## Tickets proposés

1. Captcha sur connexions anonymes et plafond IA par fenêtre courte (F-01).
2. Vérification automatisée des réglages Auth de production (F-02).
3. Déploiement OVH conditionné à la CI, clé d'hôte SSH épinglée, `.env` sûr (F-03, F-11).
4. Purge périodique de `rate_limits` (F-05).
5. Épinglage des actions GitHub et Dependabot (F-06, F-12).
6. Jeu de tests adversariaux et filtre de sortie IA (F-07).
7. Garde-fou `AI_PROVIDER_STUB` en production (F-08).
8. Journaux d'accès : durée et mention légale (F-09).
