# Software factory (`/factory`)

Faire passer **un** ticket de l'issue GitHub à une PR prête pour la review humaine, avec une spec écrite, une implémentation validée et cinq relectures spécialisées faites en local. Issue #164, inspirée de [zazencodes/software-factory-claude-code](https://github.com/zazencodes/zazencodes-season-3/tree/main/src/software-factory-claude-code) et adaptée aux règles Numa.

## La boucle

```
issue → spec-writer → builder → [security, code, ux, ui, editorial] → WAIT FOR ALL
                         ▲                                                │
                         └──────── un CHANGES : relancer le builder ◄─────┤ (2 fois max)
                                                                          ▼ tous PASS
                     push + PR vers master ◄─ APPROVE ─ approver ─ ESCALATE → needs-human
```

- La session qui lance `/factory` devient l'orchestrateur (`.claude/skills/factory/SKILL.md`). Elle lance les agents et est la seule à écrire le `job.json` du job ; elle n'écrit ni code, ni spec, ni review.
- Les agents tirent leur contexte de fichiers, pas de la conversation, et chacun écrit un seul fichier. Chaque review commence par `VERDICT: PASS` ou `VERDICT: CHANGES` ; `decision.md` par `APPROVE` ou `ESCALATE` ; `build.md` par `STATUS: READY` ou `STATUS: BLOCKED`.
- Les cinq reviewers tournent en parallèle ; un round n'est terminé que quand les cinq fichiers existent. Un seul `CHANGES` relance le même builder (2 relances maximum, soit 3 rounds) ; au-delà, le job passe à un humain.
- **Aucun merge, jamais.** `APPROVE` pousse la branche et ouvre la PR vers `master` (`Closes #<id>`), puis passe le ticket en « In review ». La PR suit ensuite le circuit normal : review Claude de la CI, review et merge humains.

## Agents

| Agent | Modèle | Écrit | Angle |
|---|---|---|---|
| `spec-writer` | Opus | `spec.md` | issue, tickets liés, ticket `[Design]` et `docs/design/handoff.md` → exigences, périmètre, critères vérifiables |
| `builder` | Opus | `build.md` + commits | implémentation, tests dans le même commit, les cinq validations de `CLAUDE.md` (+ Supabase / Deno si concerné) |
| `reviewer-security` | Opus | `round-N/review-security.md` | RLS, Edge Functions, secrets et `VITE_*`, données personnelles, rate limiting, dépendances |
| `reviewer-code` | Sonnet | `round-N/review-code.md` | rubrique de `pr-reviewer.md` (score ≥ 80 sans bloquant), lint, typecheck, tests ciblés |
| `reviewer-ux` | Sonnet | `round-N/review-ux.md` | parcours, états, textes `t()`, IDs HTML, `htmlFor`, accessibilité, mobile |
| `reviewer-ui` | Sonnet | `round-N/review-ui.md` | tokens `@theme`, composants `src/components/ui/`, maquette, stories |
| `reviewer-editorial` | Opus | `round-N/review-editorial.md` | règles éditoriales de `ai-astrology.md` : compréhensible, transparent, non catégorique ; prompts IA |
| `approver` | Opus | `decision.md` | critères remplis, merge-tree propre, escalades obligatoires |

`reviewer-code` n'a pas de critères propres : il applique `.claude/agents/pr-reviewer.md`, source unique des critères de review (aussi utilisée par `/review-pr` et `claude-review.yml`).

### Escalades obligatoires

L'approver escalade (`needs-human`) dès que le diff touche : migrations, RLS, privilèges SQL ou `supabase/config.toml` ; authentification ou sessions anonymes ; `.github/workflows/`, Docker, Caddy, déploiement OVH ou scripts de build ; une dépendance ; un prompt IA, le contexte envoyé au modèle ou une règle éditoriale ; quotas, rate limiting ou coût externe ; ou s'il repose sur une hypothèse qui est une décision produit.

## Commandes

```
/factory <issue-id>              un ticket existant
/factory <feature>               crée l'issue (type:feature, Project 3) puis la traite
/factory next                    premier ticket « Ready » du Project 3 (priorité p0 > p1 > p2)
/factory rework <id> <note>      renvoie un job needs-human au builder avec une consigne
/factory resume <id>             reprend un job interrompu à son stage
/factory pr <id>                 ouvre la PR d'un job escaladé, après décision humaine
```

« Ready » est le feu vert humain : `/factory next` ne prend rien dans « Backlog », et écarte les `type:epic` et `type:research`.

## Fichiers et état

```
factory/dashboard.html                tableau de suivi (versionné)
factory/jobs/<id>/job.json            état du job, écrit par l'orchestrateur (ignoré par Git)
factory/jobs/<id>/spec.md, build.md, decision.md, pr-body.md, rework-<k>.md
factory/jobs/<id>/round-<N>/review-{security,code,ux,ui,editorial}.md
factory/jobs/.supabase-lock/owner     verrou de la stack Supabase locale
../numa-factory/<id>/                 worktree du job, sur issue-<id>-<slug>
```

- `<id>` = numéro de l'issue. Réserver un job = `mkdir factory/jobs/<id>` : deux sessions ne peuvent pas prendre le même ticket.
- Chaque job a son worktree, créé depuis `origin/master` à jour (jamais de PR empilée), avec `npm ci` et une copie du `.env` local (ignoré par Git, clés publishables uniquement) pour le dev server. Le worktree est supprimé une fois la PR ouverte ; la branche reste pour les corrections de la CI.
- Ports du dev server : `5100 + 10 × id` (builder), `+1` (UX), `+2` (UI). Sessions `agent-browser` nommées `<id>-builder`, `<id>-ux`, `<id>-ui`.

## Tableau de suivi

```bash
cd factory && python -m http.server
```

Ouvrir <http://localhost:8000/dashboard.html>. Les jobs avancent de colonne en colonne (Spec, Build, Review, Décision, PR ouverte, À trancher), les pastilles des cinq reviewers se remplissent à chaque verdict, et un clic sur une carte affiche ses fichiers Markdown. Rafraîchi toutes les deux secondes. Le statut global des tickets reste dans le GitHub Project.

## Jobs en parallèle

Une session par job : ouvrir plusieurs sessions Claude Code dans le dépôt et lancer `/factory` dans chacune. Limites :

- **Supabase** : une seule stack locale (`supabase start`). Un job dont le périmètre touche `supabase/` prend le verrou `factory/jobs/.supabase-lock/` avant le build et le rend en `pr-opened` ou `needs-human`. Un second job Supabase attend en `needs-human` et se relance par `/factory resume <id>`.
- **Fichiers chauds** (`src/App.tsx`, `decision-log.md`, JSON i18n partagés, `package.json`, `package-lock.json`, routes, configuration) : la factory ne coordonne pas les fichiers entre jobs. Deux jobs qui les touchent produisent des PR en conflit : les lancer l'un après l'autre, ou passer par `/orchestrate` qui gère les `claims`.
- **Windows** : les chemins sont absolus avec des barres obliques (`git rev-parse --show-toplevel`) ; `npm ci` par worktree est long ; les commandes passent par Git Bash.

## Prérequis

- `gh` authentifié, avec accès au Project « Numa » (scope `project`).
- `.env` présent dans le checkout principal pour les jobs qui ont des pages à regarder.
- CLI Supabase et Docker pour les jobs qui touchent `supabase/` ; Deno pour `supabase/functions/`. Sans eux, le builder s'arrête en `BLOCKED`.
- Optionnel : le CLI [`agent-browser`](https://github.com/vercel-labs/agent-browser) (`npm install -g agent-browser`), utilisé par le builder et les reviewers UX et UI pour regarder l'app. Sans lui, la vérification visuelle est remplacée par la relecture des composants et des tests, et signalée dans les reviews.

## `/factory`, `/orchestrate`, `/review-pr` et la CI

| | `/factory` | `/orchestrate` | `/review-pr` + `claude-review.yml` |
|---|---|---|---|
| Portée | un ticket, en profondeur | jusqu'à 8 tickets, en vagues | une branche ou une PR |
| Review avant PR | cinq angles en local, jusqu'à 3 rounds | aucune (laissée à la CI) | une rubrique, score ≥ 80 |
| Validation | les cinq commandes de `CLAUDE.md` | lint, typecheck, tests ciblés | — |
| Coût | élevé (5 à 8 agents par round, Opus) | modéré (workers Sonnet) | faible |

La factory sert aux tickets à risque ou visibles (écrans, textes de lecture, logique métier) ; `/orchestrate` aux lots de tickets simples. La review Claude de la CI (`claude-review.yml`) reste active sur les PR de la factory comme filet de sécurité : elle applique la même rubrique que `reviewer-code` et peut pousser ses corrections sur la branche.

## Modifier la factory

Changer la boucle : `.claude/skills/factory/SKILL.md`. Changer un angle de review ou une règle d'escalade : le fichier de l'agent dans `.claude/agents/`. Les critères de qualité du code se changent dans `pr-reviewer.md`, pas dans `reviewer-code.md`.
