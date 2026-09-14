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

## 2026-09-14 — Usage de n8n (issue #44)

Contexte : n8n était listé dans la stack (`architecture.md`) sans périmètre défini. Besoin de clarifier sa place avant que des workflows soient ajoutés au fil de l'eau.
Décision : n8n reste **hors chemin critique**. Auth, chat et calcul astrologique restent implémentés directement dans l'application (Supabase + backend applicatif), jamais derrière un workflow n8n. Aucune tâche asynchrone ne justifie n8n au stade actuel du MVP (pas de file d'attente, pas d'intégration tierce en place) ; n8n n'est donc **pas installé** sur OVH pour l'instant. S'il devient nécessaire (ex. notifications planifiées, intégration tierce non critique), l'installation se fera en conteneur Docker séparé de l'application principale, avec : sauvegardes régulières du volume de données n8n, accès exposé exclusivement en HTTPS (Caddy, comme pour l'app — voir `deployment.md`), et accès administrateur n8n protégé par identifiants dédiés hors dépôt (secret GitHub Actions ou `.env` serveur, jamais commité). Tout webhook n8n exposé publiquement devra être signé/authentifié avant traitement.
Alternatives écartées : installer n8n dès maintenant "au cas où" — écarté (pas de besoin identifié, ajouterait de la surface d'attaque et de maintenance sans valeur MVP).

## 2026-09-14 — Déploiement OVH (issue #43)

Contexte : besoin d'un déploiement HTTPS reproductible sur le VPS OVH (Ubuntu 22.04), avec secrets hors dépôt et redémarrages/logs gérés (issue #43). Aucun nom de domaine disponible au moment du déploiement.
Décision : conteneurisation Docker (build multi-stage Vite → image Caddy servant le statique) ; Caddy comme reverse proxy avec HTTPS automatique (Let's Encrypt) ; en l'absence de domaine, `SITE_ADDRESS` pointe sur un sous-domaine `sslip.io` résolvant vers l'IP du VPS (permet un certificat TLS valide sans domaine propre, migration ultérieure = simple changement de secret) ; déploiement automatisé via `.github/workflows/deploy.yml` (rsync + `docker compose up --build` en SSH) déclenché sur push `master` ; secrets (accès SSH, clés Supabase, adresse du site) exclusivement dans les secrets GitHub Actions et le fichier `.env` généré côté serveur, jamais commités ; accès serveur par clé SSH dédiée au déploiement (pas de mot de passe) ; `ufw` restreint le VPS aux ports 22/80/443.
Alternatives écartées : Nginx + Certbot (renouvellement TLS manuel à gérer, plus de configuration) au profit de Caddy (HTTPS automatique intégré) ; déploiement sans conteneurisation (build direct sur le serveur) écarté au profit de Docker pour la reproductibilité et la gestion des redémarrages/logs.

## 2026-08-21 — Stratégie de tests et CI (issue #59)

Contexte : besoin de rendre chaque changement testable et de bloquer le merge en cas d'échec qualité (issue #59). Le dépôt ne contenait encore aucun code d'application.
Décision : scaffold minimal Vite + React + TypeScript + Tailwind ; Vitest + React Testing Library (`jsdom`) pour les tests ; seuil de couverture initial fixé à 70 % (lignes, statements, fonctions, branches) ; workflow GitHub Actions `.github/workflows/ci.yml` exécutant lint/typecheck/test:coverage/build sur PR et push vers `master` et `epic/*/main`, plus un job dédié aux migrations Supabase (`supabase db reset`, ignoré tant que `supabase/migrations` n'existe pas) ; `master` protégée via branch protection classique, `epic/*/main` via un repository ruleset (pattern glob, actif avant même la création de la branche) — check CI obligatoire, branche à jour, 1 review humaine, force-push et suppression interdits.
Alternatives écartées : seuil de couverture à 0 % (pas de garde-fou) ou à 100 % (trop rigide en phase de démarrage) — 70 % retenu comme compromis initial, révisable.

## 2026-08-21 — Structuration de CLAUDE.md

Contexte : besoin d'encadrer Claude Code sans concentrer toute la documentation dans un seul fichier long (issue #58).
Décision : `CLAUDE.md` court à la racine + documents spécialisés sous `docs/claude/` (architecture, git-workflow, development, supabase, ai-astrology, security, pull-requests, decision-log), indexés depuis `CLAUDE.md`.
Alternatives écartées : un unique fichier `CLAUDE.md` exhaustif — jugé moins maintenable dans la durée.
