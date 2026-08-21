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
