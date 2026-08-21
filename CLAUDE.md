# CLAUDE.md — Numa

Règles essentielles pour Claude Code sur ce dépôt. Documentation détaillée dans `docs/claude/`.

## Projet

Numa : application web d'astrologie personnalisée (lectures compréhensibles, transparentes, non catégoriques).

## Stack imposée

React, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL + RLS), GitHub Actions, déploiement OVH.

## Règles essentielles

- Workflow Git : `master` → `epic/<slug>/main` → `epic/<slug>/issue-<id>-<slug>`. Voir `docs/claude/git-workflow.md`.
- Toute modification passe par une pull request. **Aucun merge automatique, jamais.** Voir `docs/claude/pull-requests.md`.
- Tout nouveau fichier de logique ou composant significatif est accompagné de son test **dans la même PR**. Voir `docs/claude/development.md`.
- Avant de considérer une tâche terminée : lint, typecheck, tests, couverture, build. Voir `docs/claude/development.md`.
- Aucun secret, clé privée ou donnée personnelle commité. Voir `docs/claude/security.md`.
- RLS obligatoire sur toute table Supabase exposée à des données utilisateur. Voir `docs/claude/supabase.md`.
- Notifications Discord (PR, CI, tickets) : webhook stocké dans `secrets.DISCORD_WEBHOOK_URL`, jamais dans le code. Voir `docs/claude/pull-requests.md`.

## Index de la documentation

| Document | Contenu |
|---|---|
| `docs/claude/architecture.md` | Stack React, Tailwind CSS, Supabase, OVH, n8n |
| `docs/claude/git-workflow.md` | Branches, PRs, statuts |
| `docs/claude/development.md` | Commandes, qualité, tests, conventions de code |
| `docs/claude/supabase.md` | Auth, sessions anonymes, PostgreSQL, migrations, RLS |
| `docs/claude/ai-astrology.md` | API astrologique, IA, contexte structuré, règles éditoriales |
| `docs/claude/security.md` | Secrets, données personnelles, rate limiting, logs |
| `docs/claude/pull-requests.md` | Création de PR, corrections, notifications, interdiction de merge auto |
| `docs/claude/decision-log.md` | Décisions d'architecture et règles évolutives |

Consulter le document spécialisé concerné avant toute tâche touchant à son périmètre.
