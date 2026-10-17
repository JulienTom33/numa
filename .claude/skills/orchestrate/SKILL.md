---
name: orchestrate
description: Orchestre plusieurs tickets Numa en parallèle (5 workers max) en évitant les conflits de fichiers. Usage /orchestrate <ids de tickets>.
model: opus
effort: medium
disable-model-invocation: true
argument-hint: "<id> [<id> ...]"
---

Tu es l'orchestrateur. Tu planifies et délègues ; tu n'implémentes pas toi-même sauf tâche mécanique triviale. Tickets : $ARGUMENTS

## Budget (non négociable)
- 5 workers `ticket-worker` simultanés maximum ; 8 tickets et 2 vagues maximum par exécution. Au-delà, propose la suite pour un lot suivant.
- Sorties de commandes courtes (`--json … --jq`, `head`, `tail`) ; pas de lecture de gros fichiers.
- Un worker qui échoue deux fois : stop, rapporte, demande à l'utilisateur. Aucune boucle de retry.
- Tâche mécanique (retrait de commentaires, conflits de merge, mise à jour de branche) : fais-la toi-même en commandes courtes ou délègue à un agent avec `model: "haiku"`.

## Étapes
1. **Triage** : pour chaque ticket, `gh issue view <id> --json title,body,labels --jq …` ; retiens objectif, critères d'acceptation et « Tickets liés ». Ignore tout ticket déjà couvert par une PR ouverte (`gh pr list --search "<id>" --json number,title`).
2. **Claims** : pour chaque ticket, liste les fichiers/dossiers qu'il modifiera (`Grep`/`Glob` ciblés, docs concernées). Une dépendance entre tickets (« Tickets liés », ordre d'une epic) force des vagues successives.
3. **Conflits** : deux tickets sont en conflit s'ils partagent un claim ou si l'un dépend de l'autre. Fichiers chauds, conflit systématique : `src/App.tsx`, `docs/claude/decision-log.md`, `src/i18n/locales/fr/*.json` partagés, `package.json`, `package-lock.json`, fichiers de routes et de configuration. Un ticket qui déplace/renomme des fichiers passe seul.
4. **Vagues** : regroupe les tickets sans conflit (≤ 5). Écris le plan (vagues, claims, dépendances) dans `.claude/orchestration/plan.md` (ignoré par git) et affiche-le en tableau court. Demande validation à l'utilisateur uniquement si le plan dépasse le budget ou comporte un choix ambigu.
5. **Dispatch** : lance tous les workers d'une vague dans un seul message (`Agent`, `subagent_type: "ticket-worker"`), un par ticket. Prompt court : `id`, `slug`, `claims` autorisés, fichiers chauds interdits, rappel « rapport ≤ 5 lignes ». Ne répète pas les règles déjà dans l'agent.
6. **Fichiers chauds** : les workers renvoient le diff proposé (`BESOIN:`). Applique-le toi-même en une passe séquentielle après la vague, sur la branche concernée, ou ouvre un ticket de suivi.
7. **Après les PR** : ne poll pas et n'attends pas la CI. La review Claude de la CI (`claude-review.yml`) note la PR, corrige et repousse jusqu'à un score ≥ 80. Passe à la vague suivante seulement quand l'utilisateur a mergé les PR dont elle dépend.
8. **Synthèse finale** : tableau `ticket | PR | review Claude (label/score) | CI`, via `gh pr list --json number,title,labels,statusCheckRollup`. Liste les PR prêtes pour un merge humain, à merger par lot. Tu ne merges jamais et tu ne lances pas `gh pr update-branch` sur toutes les PR : propose une mise à jour unique après le lot.
9. Termine en suggérant `/clear` avant le lot suivant.
