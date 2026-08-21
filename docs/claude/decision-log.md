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

## 2026-08-21 — Structuration de CLAUDE.md

Contexte : besoin d'encadrer Claude Code sans concentrer toute la documentation dans un seul fichier long (issue #58).
Décision : `CLAUDE.md` court à la racine + documents spécialisés sous `docs/claude/` (architecture, git-workflow, development, supabase, ai-astrology, security, pull-requests, decision-log), indexés depuis `CLAUDE.md`.
Alternatives écartées : un unique fichier `CLAUDE.md` exhaustif — jugé moins maintenable dans la durée.
