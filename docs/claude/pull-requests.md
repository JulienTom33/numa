# Pull Requests

## Création

- Une PR par ticket, depuis `epic/<slug>/issue-<id>-<slug>` vers `epic/<slug>/main` (ou `master` si pas d'epic).
- Description de PR claire : objectif, changements, plan de test.
- Tests inclus dans la même PR que le code qu'ils couvrent.

## Corrections

- Les retours de review sont traités par nouveaux commits sur la même branche, pas par rebase forcé destructif sauf demande explicite.
- CI doit repasser verte après chaque correction.

## Notifications

- Le ticket GitHub lié est référencé dans la PR (ex. `Closes #58`) quand la PR clôt le ticket.

## Interdiction de merge automatique

**Aucune PR n'est mergée automatiquement, sous aucune condition** (CI verte, review approuvée, urgence perçue). Le merge est toujours une action humaine explicite, déclenchée par l'utilisateur ou une personne autorisée du projet. Claude Code ne merge jamais une PR de sa propre initiative.
