# Journal de décisions

Décisions d'architecture et règles évolutives du projet Numa. Ajouter une entrée à chaque décision structurante, la plus récente en premier.

## Format d'entrée

```
## AAAA-MM-JJ — Titre de la décision

Contexte : pourquoi la question se posait.
Décision : ce qui a été choisi.
Alternatives écartées : le cas échéant.
```

## Entrées

## 2026-08-21 — Stratégie de tests et CI (issue #59)

Contexte : besoin de rendre chaque changement testable et de bloquer le merge en cas d'échec qualité (issue #59). Le dépôt ne contenait encore aucun code d'application.
Décision : scaffold minimal Vite + React + TypeScript + Tailwind ; Vitest + React Testing Library (`jsdom`) pour les tests ; seuil de couverture initial fixé à 70 % (lignes, statements, fonctions, branches) ; workflow GitHub Actions `.github/workflows/ci.yml` exécutant lint/typecheck/test:coverage/build sur PR et push vers `master` et `epic/*/main`, plus un job dédié aux migrations Supabase (`supabase db reset`, ignoré tant que `supabase/migrations` n'existe pas) ; `master` protégée via branch protection classique, `epic/*/main` via un repository ruleset (pattern glob, actif avant même la création de la branche) — check CI obligatoire, branche à jour, 1 review humaine, force-push et suppression interdits.
Alternatives écartées : seuil de couverture à 0 % (pas de garde-fou) ou à 100 % (trop rigide en phase de démarrage) — 70 % retenu comme compromis initial, révisable.

## 2026-08-21 — Structuration de CLAUDE.md

Contexte : besoin d'encadrer Claude Code sans concentrer toute la documentation dans un seul fichier long (issue #58).
Décision : `CLAUDE.md` court à la racine + documents spécialisés sous `docs/claude/` (architecture, git-workflow, development, supabase, ai-astrology, security, pull-requests, decision-log), indexés depuis `CLAUDE.md`.
Alternatives écartées : un unique fichier `CLAUDE.md` exhaustif — jugé moins maintenable dans la durée.
