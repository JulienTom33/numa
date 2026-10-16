# Supabase

## Auth

- Authentification via Supabase Auth.
- Sessions anonymes supportées pour permettre l'usage sans compte (lecture astrologique avant inscription) ; migration vers compte identifié gère la conservation des données déjà produites.
- Conversion anonyme → compte : identité rattachée au même user id (`src/lib/accountUpgrade.ts`, hook `useAccountUpgrade`) ; `profiles.status` passe à `authenticated` par trigger sur `auth.users.is_anonymous`. Requiert `enable_manual_linking` pour l'OAuth. Voir `decision-log.md` (issue #15).

### Inscription et connexion (issue #14)

- Client : `src/lib/auth.ts` (actions Supabase, erreurs normalisées `AuthFlowError` : `code` + `retryable`, jamais le message technique) et hook `useAuth()` (une seule instance, dans `App`) ; parcours d'écrans `src/features/auth/AuthFlow.tsx` (AuthScreen + MagicLinkScreen). Messages affichés : clés `auth:errors.<code>`.
- Lien magique : `signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser: true } })` — même action en inscription et en connexion (le compte est créé s'il n'existe pas).
- OAuth Google / Apple : `signInWithOAuth({ provider, options: { redirectTo } })`.
- **Session anonyme** : l'inscription (lien email ou OAuth) passe par la conversion #15 (`updateUser({ email })` / `linkIdentity`, même user id, aucune donnée copiée). La connexion à un compte existant remplace la session anonyme : un avertissement est affiché, les données anonymes ne sont pas fusionnées (`decision-log.md`, #15).
- Événement « converti » : avant la conversion, l'user id anonyme est mémorisé (`localStorage`, clé `numa:pending-conversion`) ; `useAuth().converted` vaut `true` dès que ce même user id devient non anonyme (y compris après rechargement ou dans l'onglet ouvert par le lien), jusqu'à `acknowledgeConversion()`. L'écran Migration (#86) s'appuie dessus.
- Restauration : session persistée par `supabase-js` (`localStorage`), relue par `getSession()` au chargement puis suivie par `onAuthStateChange`.
- Erreurs de retour (`#error=…&error_code=…` ou query) : lues au chargement, affichées sur l'écran de connexion, puis retirées de l'URL.
- Déconnexion : `useAuth().signOut()`.

### Configuration Supabase requise (dashboard, par environnement)

Aucun secret dans le dépôt : identifiants OAuth saisis dans le dashboard (ou `env(…)` dans `supabase/config.toml` en local).

- **Authentication → URL Configuration** : `Site URL` = URL publique de l'app ; `Redirect URLs` contient l'origine de l'app suivie de `/` (ex. `https://<domaine>/`, et `http://localhost:5173/` pour le dev Vite). L'app envoie `redirectTo = <origine>/` ; une URL absente de la liste est remplacée par la `Site URL`.
- **Authentication → Sign In / Providers** : Email activé (lien magique) ; Anonymous sign-ins activé ; **Allow manual linking** activé (`enable_manual_linking`, requis par `linkIdentity`).
- **Google** : client OAuth (Google Cloud) dont l'URI de redirection autorisée est `https://<ref>.supabase.co/auth/v1/callback` ; client ID et secret saisis dans le provider Google.
- **Apple** : Services ID, Key ID, Team ID et clé privée (Apple Developer) ; Return URL = la même callback Supabase. Le secret Apple expire (6 mois) : à renouveler.
- **Email** : la confirmation (`Confirm email`) détermine si la conversion anonyme est immédiate ou attend le clic ; les gabarits « Magic Link » et « Change Email Address » doivent garder `{{ .ConfirmationURL }}`. SMTP personnalisé recommandé en production (limite d'envoi du SMTP Supabase).
- Local (`supabase/config.toml`) : `site_url` / `additional_redirect_urls` à aligner sur le port du serveur Vite si l'on teste les liens en local ; providers `[auth.external.google|apple]` désactivés par défaut.

## PostgreSQL

- Schéma versionné via migrations Supabase (`supabase/migrations`).
- Pas de modification de schéma en production hors migration versionnée.

## RLS (Row Level Security)

- **RLS activé sur toute table contenant des données utilisateur.**
- Une table sans RLS n'est acceptée que si elle ne contient aucune donnée liée à un utilisateur (référentiel public, config statique) — à justifier explicitement dans la PR.
- Policies testées : un utilisateur ne doit jamais pouvoir lire/modifier les données d'un autre utilisateur, y compris en session anonyme.
- Tests RLS via pgTAP dans `supabase/tests/database/` (accès nominal + accès interdit, par table). Exécutés en CI par `supabase test db` (job `supabase-migrations`), et localement via la même commande après `supabase start`.

## Migrations

- Chaque migration est un fichier versionné dans le dépôt, appliqué via l'outillage Supabase.
- Pas de migration destructive (drop de colonne/table contenant des données) sans validation humaine explicite.

## Edge Functions

- Code serveur dans `supabase/functions/` (structure dans `architecture.md`).
- Local : `supabase start`, puis `supabase functions serve` (rechargement à chaud) ; tests unitaires : `deno task test` dans `supabase/functions/`.
- Test de bout en bout : `scripts/smoke-edge-functions.sh` (session anonyme réelle → `whoami`, appel sans JWT → 401), exécuté en CI dans le job `supabase-migrations`.
- Secrets d'une fonction : `supabase secrets set NOM=valeur --project-ref <ref>`. En local : `supabase/functions/.env` (non commité).
- Une table que seules les fonctions doivent modifier (quota, résultats calculés) n'a pas de policy `insert` / `update` / `delete` pour `authenticated` ; la fonction écrit avec la clé secrète (`SUPABASE_SECRET_KEYS`, client `createAdminClient()`).
- Une fonction SQL appelée uniquement par le serveur est `security definer` avec `set search_path = ''`, et son `EXECUTE` est révoqué à `public`, `anon` et `authenticated` puis accordé à `service_role` (les privilèges par défaut de Supabase l'ouvrent sinon à tous).

## Quota de questions anonymes

- Deux questions par session anonyme (`ANONYMOUS_QUESTION_LIMIT`, `supabase/functions/chat/quota.ts`), comptées dans `usage_counters` (`period_start = '-infinity'` : toute la session).
- Edge Function `chat` : `GET` renvoie `{ quota }`, `POST { question }` renvoie `{ answer, quota }`, `429 question_quota_exceeded` au-delà de la limite, `502 provider_unavailable` si le fournisseur échoue (question non décomptée).
- Parcours serveur : `reserve_question` → appel fournisseur → `commit_question` (succès) ou `release_question` (échec). Voir `decision-log.md` (2026-10-15, #27).
- Client : `src/lib/questionQuota.ts` et `useQuestionQuota()` ; le compteur affiché vient toujours du serveur.

## Clés API

- Supabase remplace les clés `anon` / `service_role` (JWT) par des clés `sb_publishable_…` (client) et `sb_secret_…` (serveur). **Les anciennes clés cessent de fonctionner fin 2026.**
- Client : clé publishable dans `VITE_SUPABASE_PUBLISHABLE_KEY` (migration faite dans #101). Les anciennes clés du projet sont à désactiver dans le dashboard (Settings → API Keys → Legacy API Keys) une fois la prod vérifiée.
- Fonctions : `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` (JSON, clé `default`), fournies par la plateforme ; `_shared/supabase.ts` se replie sur `SUPABASE_ANON_KEY` pour la stack locale.
- Une clé API n'est jamais envoyée en `Authorization: Bearer` (ce n'est pas un JWT) : en-tête `apikey` uniquement.

## Environnements

- **Local** : stack Supabase locale via `supabase start` (config versionnée dans `supabase/config.toml`). Utilisé pour le développement et testé en CI par le job `supabase-migrations` (`supabase start` + `supabase db reset`).
- **Staging** et **Production** : projets Supabase dédiés (dashboard Supabase), un par environnement. Jamais de partage de projet entre staging et prod.
- Chaque environnement a son propre jeu de variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, ...) injecté via les secrets et variables GitHub Actions / la config d'hébergement OVH — jamais commité.

## Variables d'environnement : publiques vs secrètes

- **Publiques** (préfixe `VITE_`, exposées au bundle client) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`). Sûres à exposer : les droits réels sont appliqués par les policies RLS.
- **Secrètes** (jamais préfixées `VITE_`, jamais côté client) : clé `sb_secret_…` (`SUPABASE_SECRET_KEYS` dans les Edge Functions), utilisée uniquement dans du code serveur pour bypasser RLS quand nécessaire. Stockées en secrets GitHub Actions / variables d'environnement serveur, jamais dans `.env` commité ni dans `.env.example` avec une vraie valeur.
- Voir `.env.example` à la racine pour le gabarit des variables publiques.
