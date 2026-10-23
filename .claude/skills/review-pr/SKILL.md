---
name: review-pr
description: Relit en local la branche courante (ou une PR) avec l'agent pr-reviewer, plus reviewer-ui-ux et reviewer-editorial selon les chemins du diff, avant d'ouvrir ou de mettre à jour la PR. Usage /review-pr [numéro de PR].
disable-model-invocation: true
argument-hint: "[PR]"
---

Lance la review sur : $ARGUMENTS (vide = différence entre `origin/master` et `HEAD`).

1. `git fetch origin master` si la cible est la branche courante.
2. Liste les fichiers du diff (`git diff --name-only origin/master...HEAD` ou `gh pr diff <n> --name-only`) et choisis les reviewers spécialisés selon la table « Reviewers spécialisés » de `docs/claude/pull-requests.md`. Aucun chemin ne correspond : `pr-reviewer` seul.
3. Invoque **dans un seul message**, pour qu'ils tournent en parallèle, `Agent` avec `subagent_type: "pr-reviewer"` et chaque reviewer retenu (`reviewer-ui-ux`, `reviewer-editorial`), avec le prompt : « Relis `git diff origin/master...HEAD` » (ou « Relis la PR #<n> »). Pour `reviewer-ui-ux` sur la branche courante, ajoute « Checkout : <dossier courant>. Port : 6106. ».
4. Affiche le score et le verdict de `pr-reviewer`, le verdict de chaque reviewer spécialisé (et la ligne `vérification visuelle` de `reviewer-ui-ux`), puis les findings tels quels.
5. Verdict global `changes_requested` si `pr-reviewer` le rend ou si un reviewer spécialisé remonte un bloquant. Corrige alors les findings bloquants puis majeurs de tous les reviewers dans le périmètre du ticket, relance lint/typecheck/tests ciblés, puis relance une fois la review (mêmes reviewers). Maximum 3 tours ; si le score n'augmente pas et que les bloquants ne diminuent pas sur 2 tours consécutifs, arrête-toi et rapporte.
6. Score ≥ 80 sans bloquant chez aucun reviewer : la branche est prête pour la PR. Ne merge jamais.
