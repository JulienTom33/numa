# Supabase

## Auth

- Authentification via Supabase Auth.
- Sessions anonymes supportées pour permettre l'usage sans compte (lecture astrologique avant inscription) ; migration vers compte identifié gère la conservation des données déjà produites.
- Conversion anonyme → compte : identité rattachée au même user id (`src/lib/accountUpgrade.ts`, hook `useAccountUpgrade`) ; `profiles.status` passe à `authenticated` par trigger sur `auth.users.is_anonymous`. Requiert `enable_manual_linking` pour l'OAuth. Voir `decision-log.md` (issue #15).

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
- Une table que seules les fonctions doivent modifier (quota, résultats calculés) n'a pas de policy `insert` / `update` / `delete` pour `authenticated` ; la fonction écrit avec la clé secrète (`SUPABASE_SECRET_KEYS`).

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
