# CLAUDE.md — Sidéra

Règles essentielles pour Claude Code sur ce dépôt. Documentation détaillée dans `docs/claude/`.

## Projet

Sidéra : application web d'astrologie personnalisée (lectures compréhensibles, transparentes, non catégoriques).

- Tickets : issues GitHub de `JulienTom33/numa`, suivies dans le GitHub Project « Sidéra » (n° 3).
- Maquette : Claude Design, projet « App de voyance et astrologie », fichier `Astraia.dc.html`. Chaque écran a un ticket `[Design]` (label `design`) relié à ses tickets fonctionnels.

## Stack imposée

React, TypeScript, Tailwind CSS, Supabase (Auth + PostgreSQL + RLS), GitHub Actions, déploiement OVH.

## Règles essentielles

- Workflow Git : une branche `issue-<id>-<slug>` par ticket, créée depuis `master`, PR vers `master`. Voir `docs/claude/git-workflow.md`.
- Toute modification passe par une pull request. **Aucun merge automatique, jamais.** Voir `docs/claude/pull-requests.md`.
- Tout nouveau fichier de logique ou composant significatif est accompagné de son test **dans la même PR**. Voir `docs/claude/development.md`.
- **Aucun commentaire dans le code, JSDoc compris** ; commentaires libres uniquement dans les fichiers de test. Règle ESLint `sidera/no-comments` (encore tolérante aux JSDoc de fonction exportée jusqu'à #134). Voir `docs/claude/development.md`.
- Toute fonctionnalité utilisateur ajoute ou étend un parcours E2E Playwright (`e2e/`) dans la même PR. Voir `docs/claude/development.md` (Tests end-to-end).
- Aucun texte affiché en dur : tout passe par `t()` (react-i18next), clés dans `src/i18n/locales/fr/<namespace>.json`. Voir `docs/claude/development.md` (Internationalisation).
- Aucun secret, clé privée ou donnée personnelle commité. Voir `docs/claude/security.md`.
- RLS obligatoire sur toute table Supabase exposée à des données utilisateur. Voir `docs/claude/supabase.md`.
- Code serveur = Supabase Edge Functions (`supabase/functions/`). Toute clé d'API astrologique ou IA y reste, jamais dans le bundle client (`VITE_*`). Voir `docs/claude/architecture.md`.
- Chaque PR est d'abord relue par Claude en CI (`claude-review.yml`, score ≥ 80 requis, jusqu'à 5 corrections automatiques) ; la review et le merge humains restent obligatoires. Voir `docs/claude/pull-requests.md`.
- Notifications Discord (PR, CI, tickets) : webhook stocké dans `secrets.DISCORD_WEBHOOK_URL`, jamais dans le code. Voir `docs/claude/pull-requests.md`.

## Interdits

- `any`, `as` de contournement, `console.log`, TODO/FIXME, code mort, commentaires.
- Texte en dur (hors tests/stories), couleur en dur, secret ou donnée personnelle commités.
- Modifier un fichier hors du périmètre du ticket, ajouter une dépendance sans la justifier dans la PR, créer une abstraction avant un second usage réel.
- Merger, approuver, force-pusher, pousser sur `master`.

## Définition de terminé

Critères d'acceptation remplis, test dans la même PR, validation ci-dessous verte, `/review-pr` à 80 ou plus sans finding bloquant, PR ouverte avec `Closes #<id>`.

## Validation avant PR

Toutes doivent passer :

```bash
npm run lint
npm run typecheck
npm run test:coverage   # seuil 70 %
npm run build
npm run build-storybook
npm run test:e2e        # stack Supabase locale + `supabase functions serve` ; aussi exécuté par le job CI `e2e`
```

Si le ticket touche `supabase/` : `supabase db reset` puis `supabase test db` (stack locale démarrée via `supabase start`).

Si le ticket touche `supabase/functions/` (code serveur Deno), dans ce dossier : `deno fmt --check`, `deno lint`, `deno task check`, `deno task test`.

## Démarrer un ticket

1. `gh issue view <id>` : lire objectif, critères d'acceptation et section « Tickets liés ».
2. Pour un ticket `[Design]`, se référer à la maquette ; pour un ticket fonctionnel, vérifier s'il a un ticket `[Design]` associé.
3. Créer la branche depuis `master` à jour (voir `docs/claude/git-workflow.md`) et passer le ticket en « In progress » dans le GitHub Project.
4. Implémenter, tester, valider, ouvrir la PR avec `Closes #<id>` (voir `docs/claude/pull-requests.md`), puis passer le ticket en « In review ».

## Index de la documentation

| Document | Contenu |
|---|---|
| `docs/claude/architecture.md` | Stack React, Tailwind CSS, Supabase, OVH, code serveur, n8n |
| `docs/claude/git-workflow.md` | Branches, labels, démarrage d'un ticket |
| `docs/claude/development.md` | Commandes, qualité, tests (unitaires et E2E), conventions de code, IDs HTML |
| `docs/claude/supabase.md` | Auth, sessions anonymes, PostgreSQL, migrations, RLS |
| `docs/claude/ai-astrology.md` | Calcul astrologique (Astronomy Engine), IA, contexte structuré, règles éditoriales |
| `docs/claude/security.md` | Secrets, données personnelles, rate limiting, logs |
| `docs/claude/pull-requests.md` | Création de PR, corrections, notifications, interdiction de merge auto |
| `docs/claude/deployment.md` | Déploiement OVH, Docker, Caddy/HTTPS, secrets, logs |
| `docs/claude/orchestration.md` | Orchestrateur, workers, coordination par fichiers, budget, boucle de review |
| `docs/claude/decision-log.md` | Décisions d'architecture et règles évolutives |
| `docs/research/api-astrologiques.md` | Comparatif des moteurs et API astrologiques, profils de référence, mesures (#50) |
| `docs/research/fournisseurs-ia.md` | Fournisseurs IA gratuits (Mistral, Groq, Gemini, OpenAI, OpenRouter) : quotas, budget de bêta, risques juridiques, mix et bascule, longueur de réponse, protocole de test (#51) |
| `docs/design/handoff.md` | Handoff design → dev : écrans du MVP, tickets, composants, tokens, états, responsive, accessibilité |

Les règles par chemin sont dans `.claude/rules/` (chargées automatiquement). Consulter le document spécialisé concerné avant toute tâche touchant à son périmètre.
