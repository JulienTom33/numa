# Guide de contribution — Numa

Ce guide permet à un·e contributeur·rice de comprendre le projet, l'installer et proposer des modifications rapidement.

## Installation

Prérequis : Node.js 20+, npm, [Docker](https://www.docker.com/) (requis par Supabase local), [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
git clone https://github.com/JulienTom33/numa.git
cd numa
npm install
cp .env.example .env
```

Renseigner `.env` avec les valeurs de votre projet Supabase (local ou distant) — voir [Variables d'environnement](#variables-denvironnement).

Lancer l'application en développement :

```bash
npm run dev
```

## Variables d'environnement

| Variable | Publique | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Oui | URL du projet Supabase (`Project Settings > API > Project URL`). |
| `VITE_SUPABASE_ANON_KEY` | Oui | Clé publique anonyme Supabase. Sûre à exposer : les droits réels sont appliqués par les policies RLS. |

Les variables secrètes (ex. `SUPABASE_SERVICE_ROLE_KEY`) ne sont jamais utilisées côté client, jamais commitées, et ne figurent pas dans `.env.example`. Voir `docs/claude/security.md` et `docs/claude/supabase.md`.

## Scripts disponibles

```bash
npm run dev             # serveur de développement Vite
npm run build           # build de production (tsc + vite build)
npm run preview         # prévisualiser le build de production
npm run lint            # ESLint
npm run typecheck       # vérification TypeScript stricte, sans émission
npm run test            # tests (Vitest)
npm run test:watch      # tests en mode watch
npm run test:coverage   # tests avec rapport de couverture
npm run notify:discord  # envoi manuel d'une notification Discord (utilisé en CI)
```

Avant de considérer une tâche terminée ou une PR prête pour review, `lint`, `typecheck`, `test`, `test:coverage` et `build` doivent tous passer.

## Convention de branches

```
master
 └── epic/<slug>/main
      └── epic/<slug>/issue-<id>-<slug>
```

- `master` : branche stable, toujours déployable.
- `epic/<slug>/main` : branche d'intégration d'une epic, reçoit les PRs des tickets de cette epic.
- `epic/<slug>/issue-<id>-<slug>` : branche de travail d'un ticket unique, créée depuis `epic/<slug>/main` (ou `master` si le ticket n'appartient pas à une epic).

Une branche de travail traite un seul ticket. Jamais de commit direct sur `master` ou `epic/<slug>/main`.

## Convention de commits

Commits atomiques, message au présent, référence au ticket entre parenthèses quand pertinent :

```
feat: ajoute le formulaire de connexion (#42)
fix: corrige la validation de l'email (#43)
docs: met à jour le guide de contribution (#54)
```

Types usuels : `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.

## Pull requests

- Une PR par ticket, depuis `epic/<slug>/issue-<id>-<slug>` vers `epic/<slug>/main` (ou `master` si pas d'epic).
- Description claire : objectif, changements, plan de test. Référencer le ticket lié (ex. `Closes #54`).
- Tests inclus dans la même PR que le code qu'ils couvrent.
- CI verte (`quality` : lint, typecheck, test:coverage, build) et une revue humaine obligatoires avant merge.
- **Aucun merge automatique, sous aucune condition.** Le merge est toujours une action humaine explicite.
- Les retours de review sont traités par de nouveaux commits sur la même branche, pas par rebase forcé sauf demande explicite.

Voir `docs/claude/pull-requests.md` pour le détail (protection des branches, notifications Discord).

## Tests

- Tout nouveau fichier de logique (hook, service, utilitaire) ou composant React significatif est accompagné de son test, dans la même PR.
- Composants testés via React Testing Library.
- Pas de mock de ce qui peut être testé en réel de façon fiable et rapide.
- Couverture minimale : 70 % (lignes, statements, fonctions, branches), vérifiée par `npm run test:coverage`.

## Migrations Supabase

- Schéma versionné via des fichiers de migration dans `supabase/migrations`.
- Aucune modification de schéma en production hors migration versionnée.
- Aucune migration destructive (drop de colonne/table contenant des données) sans validation humaine explicite.
- RLS obligatoire sur toute table exposée à des données utilisateur.

Voir `docs/claude/supabase.md` pour le détail (environnements, RLS, variables).

## Déploiement local

Stack Supabase locale (config versionnée dans `supabase/config.toml`) :

```bash
supabase start       # démarre Postgres, Auth, etc. en local
supabase db reset    # applique toutes les migrations sur une base locale propre
supabase stop         # arrête la stack locale
```

C'est cette même séquence (`supabase start` + `supabase db reset`) qui valide les migrations en CI (job `supabase-migrations`).

## Sécurité

- Aucun secret, clé API, clé privée ou token n'est commité, sous quelque forme que ce soit.
- Vérifier le contenu de tout fichier ajouté avant commit, même si son nom semble anodin.
- Aucune donnée personnelle en clair dans les logs.

Voir `docs/claude/security.md` pour le détail.
