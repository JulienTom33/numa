# Supabase

## Auth

- Authentification via Supabase Auth.
- Sessions anonymes supportées pour permettre l'usage sans compte (lecture astrologique avant inscription) ; migration vers compte identifié gère la conservation des données déjà produites.

## PostgreSQL

- Schéma versionné via migrations Supabase (`supabase/migrations`).
- Pas de modification de schéma en production hors migration versionnée.

## RLS (Row Level Security)

- **RLS activé sur toute table contenant des données utilisateur.**
- Une table sans RLS n'est acceptée que si elle ne contient aucune donnée liée à un utilisateur (référentiel public, config statique) — à justifier explicitement dans la PR.
- Policies testées : un utilisateur ne doit jamais pouvoir lire/modifier les données d'un autre utilisateur, y compris en session anonyme.

## Migrations

- Chaque migration est un fichier versionné dans le dépôt, appliqué via l'outillage Supabase.
- Pas de migration destructive (drop de colonne/table contenant des données) sans validation humaine explicite.

## Environnements

- **Local** : stack Supabase locale via `supabase start` (config versionnée dans `supabase/config.toml`). Utilisé pour le développement et testé en CI par le job `supabase-migrations` (`supabase start` + `supabase db reset`).
- **Staging** et **Production** : projets Supabase dédiés (dashboard Supabase), un par environnement. Jamais de partage de projet entre staging et prod.
- Chaque environnement a son propre jeu de variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, ...) injecté via les secrets GitHub Actions / la config d'hébergement OVH — jamais commité.

## Variables d'environnement : publiques vs secrètes

- **Publiques** (préfixe `VITE_`, exposées au bundle client) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Sûres à exposer : les droits réels sont appliqués par les policies RLS.
- **Secrètes** (jamais préfixées `VITE_`, jamais côté client) : ex. `SUPABASE_SERVICE_ROLE_KEY`, utilisée uniquement dans du code serveur (Edge Functions, jobs n8n) pour bypasser RLS quand nécessaire. Stockées en secrets GitHub Actions / variables d'environnement serveur, jamais dans `.env` commité ni dans `.env.example` avec une vraie valeur.
- Voir `.env.example` à la racine pour le gabarit des variables publiques.
