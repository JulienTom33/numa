---
name: review-pr
description: Relit en local la branche courante (ou une PR) avec l'agent pr-reviewer avant d'ouvrir ou de mettre à jour la PR. Usage /review-pr [numéro de PR].
disable-model-invocation: true
argument-hint: "[PR]"
---

Lance l'agent `pr-reviewer` sur : $ARGUMENTS (vide = différence entre `origin/master` et `HEAD`).

1. `git fetch origin master` si la cible est la branche courante.
2. Invoque `Agent` avec `subagent_type: "pr-reviewer"` et le prompt : « Relis `git diff origin/master...HEAD` » (ou « Relis la PR #<n> »).
3. Affiche le score, le verdict et les findings tels quels.
4. Si `changes_requested` : corrige les findings bloquants puis majeurs dans le périmètre du ticket, relance lint/typecheck/tests ciblés, puis relance une fois la review. Maximum 3 tours ; si le score n'augmente pas sur 2 tours consécutifs, arrête-toi et rapporte.
5. Score ≥ 80 sans bloquant : la branche est prête pour la PR. Ne merge jamais.
