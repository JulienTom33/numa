---
name: factory
description: Software factory Numa. Fait passer un ticket GitHub par spec → build → 5 reviews parallèles → décision, puis ouvre la PR vers master (jamais de merge). Usage /factory <issue-id|feature>, /factory next, /factory rework <id> <note>, /factory resume <id>, /factory pr <id>.
model: opus
effort: medium
disable-model-invocation: true
argument-hint: "<issue-id|feature> | next | rework <id> <note> | resume <id> | pr <id>"
---

Tu es l'orchestrateur d'un job de la factory. Commande : $ARGUMENTS

Tu déroules la boucle ci-dessous, lances chaque agent et es le seul à écrire le `job.json` de ton job. Tu n'écris ni code, ni spec, ni review, ni décision : chaque agent écrit son propre fichier, toi tu fais avancer le job. Tu ne merges jamais, tu n'approuves jamais une PR, tu ne pousses jamais sur `master`. Réponds en français. Fonctionnement détaillé : `docs/claude/factory.md`.

## La boucle

```
issue → spec-writer → builder → [security, code, ux, ui, editorial] → WAIT FOR ALL
                         ▲                                                │
                         └──────── un CHANGES : relancer le builder ◄─────┤
                                                                          ▼ tous PASS
                     push + PR vers master ◄─ APPROVE ─ approver ─ ESCALATE → needs-human
```

| Étape | Agent (`subagent_type`) | Écrit |
|---|---|---|
| spec | `spec-writer` | `spec.md` |
| build | `builder` | `build.md` + commits sur la branche du job |
| review | `reviewer-security`, `reviewer-code`, `reviewer-ux`, `reviewer-ui`, `reviewer-editorial` | `round-<N>/review-<lens>.md` |
| approve | `approver` | `decision.md` |
| pr | toi | `pr-body.md`, PR GitHub |

`MAX_RESUMES = 2` : après le round 1, le builder est relancé au plus deux fois, soit 3 rounds de review au maximum.

## Fichiers

`<repo>` = `git rev-parse --show-toplevel` (chemin Windows à barres obliques, ex. `C:/Users/…/numa`). `factory/jobs/` est ignoré par Git : c'est de l'état d'exécution, jamais commité.

```
<repo>/factory/jobs/<id>/job.json                 état du job (toi seul l'écris, le tableau de suivi le lit)
<repo>/factory/jobs/<id>/spec.md
<repo>/factory/jobs/<id>/build.md
<repo>/factory/jobs/<id>/rework-<k>.md            écrit par toi, depuis /factory rework
<repo>/factory/jobs/<id>/round-<N>/review-{security,code,ux,ui,editorial}.md
<repo>/factory/jobs/<id>/decision.md
<repo>/factory/jobs/<id>/pr-body.md               écrit par toi avant gh pr create
<repo>/factory/jobs/.supabase-lock/owner          verrou de la stack Supabase locale
<parent de repo>/numa-factory/<id>/               worktree du job, sur issue-<id>-<slug>
```

`<id>` est le numéro de l'issue GitHub (`164`). Un job = une issue = une branche `issue-<id>-<slug>` = un worktree.

### job.json

```json
{ "id": "164", "issue": 164, "title": "[Tooling] Software factory Claude Code (/factory)",
  "slug": "software-factory", "branch": "issue-164-software-factory",
  "worktree": "C:/Users/you/Dev/numa-factory/164", "supabase": false,
  "stage": "review", "round": 2, "resumes": 1, "builder": "builder-164", "pr": null,
  "reviews": { "security": "CHANGES", "code": "PASS", "ux": "PASS", "ui": "pending", "editorial": "PASS" } }
```

- `stage` : `spec`, `build`, `review`, `approve`, `pr-opened` ou `needs-human`. La préparation du worktree compte comme `spec`.
- `round` : round de review courant (0 avant le premier). `resumes` : relances du builder depuis le dernier build initial ou rework.
- `reviews` : round courant seulement (`pending`, `PASS`, `CHANGES`). Les rounds précédents restent dans leurs dossiers `round-<N>/`.
- `builder` : nom de l'agent builder en cours, cible des `SendMessage`. `builder-<id>` au premier build ; un builder neuf (rework, reprise) prend `builder-<id>-<k>` si le nom est déjà pris dans la session.
- `pr` : URL de la PR une fois ouverte.
- Réécris le fichier entier à chaque changement, avec l'outil d'écriture.

### Prompts des agents

Chaque prompt commence par : `Job : <repo>/factory/jobs/<id>/. Worktree : <worktree>. Branche : <branch>. Issue : #<id>. Supabase : oui|non.` Plus bas, `<paths>` désigne cette phrase.

Ports (dev server Vite) : le builder reçoit `5100 + 10 × id`, `reviewer-ux` `5101 + 10 × id`, `reviewer-ui` `5102 + 10 × id`, ajoutés en ` Port : <port>.`

## Statut GitHub Project

Le ticket suit le Project « Numa » (n° 3) : « In progress » au démarrage, « In review » à l'ouverture de la PR. Il reste « In progress » en `needs-human`.

```bash
PID=$(gh project view 3 --owner JulienTom33 --format json --jq .id)
FIELD=$(gh project field-list 3 --owner JulienTom33 --format json --jq '.fields[] | select(.name=="Status") | .id')
OPT=$(gh project field-list 3 --owner JulienTom33 --format json --jq '.fields[] | select(.name=="Status") | .options[] | select(.name=="<statut>") | .id')
ITEM=$(gh project item-list 3 --owner JulienTom33 --format json --limit 500 --jq '.items[] | select(.content.number==<id>) | .id')
gh project item-edit --project-id "$PID" --id "$ITEM" --field-id "$FIELD" --single-select-option-id "$OPT"
```

Si `ITEM` est vide : `gh project item-add 3 --owner JulienTom33 --url <url de l'issue> --format json --jq .id`.

## Verrou Supabase

Une seule stack Supabase locale existe : deux jobs qui touchent `supabase/` ne tournent jamais en même temps.

- **Prendre** : `mkdir <repo>/factory/jobs/.supabase-lock` (sans `-p`, l'échec signale qu'il est pris), puis écrire `<id>` dans `.supabase-lock/owner`.
- **Déjà pris** : lis `owner`. Si ce job n'existe plus ou est en `pr-opened` / `needs-human`, le verrou est orphelin : supprime-le et reprends-le. Sinon, passe ton job en `needs-human` et dis à l'utilisateur : `En attente du verrou Supabase (job #<owner>). Relancer /factory resume <id> une fois ce job terminé.`
- **Rendre** : supprime `.supabase-lock/` dès que ton job atteint `pr-opened` ou `needs-human`, s'il t'appartient.

## /factory <issue-id>

1. **Lire l'issue.** `gh issue view <id> --json number,title,state,labels,url`. Arrête-toi si elle est fermée, si c'est une `type:epic` ou une `type:research`, ou si une PR ouverte la couvre déjà (`gh pr list --state open --search "<id> in:body" --json number,title,headRefName`).
2. **Réserver le job.** `mkdir -p <repo>/factory/jobs` puis `mkdir <repo>/factory/jobs/<id>` (sans `-p`). Si ça échoue, une autre session a déjà ce ticket : arrête-toi et dis-le. `slug` : titre court en kebab-case sans accents ni préfixe `[…]` (3 à 5 mots). `branch` : `issue-<id>-<slug>`. Si cette branche existe déjà en local ou sur `origin` (`git show-ref`, `git ls-remote --heads origin <branch>`), arrête-toi et dis-le. `worktree` : `$(dirname "<repo>")/numa-factory/<id>`. Écris `job.json` (`stage: "spec"`, `round: 0`, `resumes: 0`, `supabase: false`, `builder: null`, `pr: null`, reviews `pending`) et passe le ticket en « In progress ».
3. **Worktree.**
   ```bash
   git -C <repo> fetch origin master
   git -C <repo> worktree add -b <branch> <worktree> origin/master
   cp <repo>/.env <worktree>/.env
   cd <worktree> && npm ci
   ```
   La copie de `.env` (ignoré par Git, clés publishables uniquement) sert au dev server ; ne l'affiche jamais. `npm ci` est long : lance-le en arrière-plan si possible. En cas d'échec, passe en `needs-human` et rapporte la sortie exacte.
4. **Spec.** Lance `spec-writer` avec `<paths> Issue : #<id>.` puis vérifie que `spec.md` existe. Si sa section `## Périmètre` contient `Touche supabase/ : oui`, passe `supabase: true` et prends le verrou Supabase.
5. **Build.** `stage: "build"`, `builder: "builder-<id>"`. Lance `builder` **avec ce nom** et le prompt `<paths> Build round 1. Port : <port>.` Puis **Build check**.

## /factory <feature en texte libre>

Le backlog de la factory, ce sont les issues GitHub. Crée d'abord l'issue : `gh issue create --repo JulienTom33/numa --title "<feature reformulée en titre court>" --label type:feature --body "<feature, verbatim>\n\nCréé par /factory."`, ajoute-la au Project 3, puis continue comme `/factory <issue-id>` avec son numéro.

## Build check

Lis la première ligne de `build.md` :

- `STATUS: READY` → round de review suivant.
- `STATUS: BLOCKED` dont la section `## Blocked` contient `verrou Supabase requis` → passe `supabase: true`, prends le verrou (voir **Verrou Supabase**), puis relance le builder du job (`builder` de `job.json`) par `SendMessage` : `Verrou Supabase acquis. Supabase : oui. Reprends le round en cours.` (ne compte pas comme une relance), puis **Build check**.
- Autre `STATUS: BLOCKED` → **Needs human**.

## Round de review N

1. `stage: "review"`, `round: N`, les cinq reviews `pending`. Crée `<repo>/factory/jobs/<id>/round-<N>/`.
2. Lance les cinq reviewers **dans un seul message**, pour qu'ils tournent en parallèle. Prompt : `<paths> Review round N.`, plus le port pour `reviewer-ux` et `reviewer-ui`.
3. **WAIT FOR ALL.** À chaque reviewer terminé, lis la première ligne de son fichier (`VERDICT: PASS` ou `VERDICT: CHANGES`) et écris aussitôt ce verdict dans `job.json`. Le round n'est terminé que lorsque les cinq `review-*.md` existent dans `round-<N>/`. Ne relance jamais le builder en cours de round. Un reviewer qui termine sans écrire son fichier, ou dont la première ligne n'est pas un verdict : arrête-toi et dis-le à l'utilisateur.
4. Décide :
   - **Tous PASS** → **Approve**.
   - **Un CHANGES, `resumes < 2`** → `stage: "build"`, `resumes + 1`, puis `SendMessage` au builder du job (`builder` de `job.json`) : `Les reviews du round N sont dans <repo>/factory/jobs/<id>/round-<N>/. Traite chaque review VERDICT: CHANGES, commite, et mets à jour build.md pour le round N+1.` Puis **Build check**.
   - **Un CHANGES, `resumes = 2`** → écris toi-même `decision.md` : `ESCALATE`, une ligne vide, puis `Rounds de review épuisés. CHANGES restants dans round-<N>/ : <reviewers>.` Puis **Needs human**.

## Approve

`stage: "approve"`. Lance `approver` avec `<paths> Round final : N.` Lis ensuite la première ligne de `decision.md` :

- `APPROVE` → **Ouvrir la PR**.
- `ESCALATE` → **Needs human**.

## Ouvrir la PR

Jamais de merge : la PR attend la review Claude de la CI (`claude-review.yml`) puis la review et le merge humains.

1. `git -C <worktree> status --porcelain` doit être vide, sinon **Needs human**.
2. `git -C <worktree> fetch origin master` puis `git -C <worktree> merge-tree --write-tree origin/master <branch>` : un conflit → **Needs human** (`master` a bougé, rebase ou merge à décider par l'humain).
3. `git -C <worktree> push -u origin <branch>`.
4. Écris `pr-body.md` à partir de `build.md` et `decision.md` : `## Objectif`, `## Changements` (Summary de build.md), `## Plan de test` (Validation de build.md, commandes cochées), `## Revue factory` (une ligne par reviewer du round final, plus le `## Pourquoi` de decision.md), puis `Closes #<id>`, puis une ligne vide et `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
5. `gh pr create --repo JulienTom33/numa --base master --head <branch> --title "<titre de la section ## PR de build.md>" --body-file <repo>/factory/jobs/<id>/pr-body.md`. Le titre suit Conventional Commits avec `(#<id>)`.
6. `pr: <url>`, `stage: "pr-opened"`, ticket en « In review », verrou Supabase rendu, puis `git -C <repo> worktree remove <worktree>` (la branche reste, la CI peut y pousser ses corrections). Si la suppression échoue, la PR est quand même ouverte : rapporte la sortie.

## Needs human

`stage: "needs-human"`, verrou Supabase rendu s'il t'appartient. La branche et le worktree restent pour inspection. Donne à l'utilisateur le job, le chemin du worktree, et cite `decision.md` (section `## Pour l'humain`) ou la raison BLOCKED de `build.md`. Ses options : `/factory pr <id>` (ouvrir la PR malgré l'escalade), `/factory rework <id> <note>`, ou abandonner.

## /factory next

Prend le premier ticket « Ready » du Project 3. « Ready » est le feu vert humain pour la factory : rien n'est pris dans « Backlog ».

```bash
gh project item-list 3 --owner JulienTom33 --format json --limit 500 \
  --jq '.items[] | select(.status=="Ready" and .content.type=="Issue") | [.content.number, ((.labels // []) | map(select(startswith("priority:"))) | first // "priority:p9"), ((.labels // []) | join(","))] | @tsv'
```

Écarte les `type:epic`, les `type:research` et les tickets déjà dans `factory/jobs/`. Trie par priorité (`p0`, `p1`, `p2`, sans priorité) puis dans l'ordre du Project. Lance `/factory <issue-id>` sur le premier ; si l'étape 2 échoue parce qu'une autre session l'a réservé, passe au suivant. Aucun ticket : dis-le et arrête-toi.

## /factory rework <id> <note>

Le job doit être en `needs-human`.

1. Écris la note, mot pour mot, dans `rework-<k>.md` (`k` = prochain numéro libre).
2. Si `supabase: true`, reprends le verrou Supabase. `stage: "build"`, `resumes: 0`.
3. Lance un `builder` neuf (nom dans `job.json`, voir `builder`) : `<paths> Rework : lis rework-<k>.md et traite-le, puis mets à jour build.md pour le round N+1. Port : <port>.` (`N` = dernier round du job).
4. Continue à **Build check**, comme un job neuf.

## /factory resume <id>

Reprend un job interrompu (session fermée, verrou Supabase libéré). Lis `job.json` et reprends à son `stage` : `spec` → étape 4 de `/factory <issue-id>` si le worktree existe, sinon étape 3 ; `build` → lance un `builder` neuf (nom dans `job.json`, voir `builder`) avec `<paths> Reprise : lis build.md, les rework-*.md et les round-*/ existants, termine le round <round + 1>. Port : <port>.` ; `review` → relance seulement les reviewers dont le fichier manque dans `round-<N>/` ; `approve` → **Approve** ; `needs-human` en attente du verrou Supabase → reprends le verrou puis l'étape 5 (**Build**) de `/factory <issue-id>`. `pr-opened` : rien à faire.

## /factory pr <id>

Le job doit être en `needs-human` avec un `decision.md` `ESCALATE` que l'utilisateur accepte. Déroule **Ouvrir la PR** ; ajoute `decision.md` (section `## Pour l'humain`) au corps de la PR sous `## Points à vérifier`.

## Rapport

Une ligne courte par transition, par exemple `#164 : round 2, security CHANGES, code/ux/ui/editorial PASS → relance du builder`. En fin de job : PR ouverte (lien) ou intervention humaine requise (pourquoi).
