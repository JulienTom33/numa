# Pull Requests

## Création

- Une PR par ticket, depuis `issue-<id>-<slug>` vers `master`.
- Titre au format Conventional Commits, avec le numéro du ticket : `feat: … (#<id>)`, `fix: …`, `docs: …`, `chore: …`.
- Description de PR claire : objectif, changements, plan de test (commandes de validation cochées), `Closes #<id>`.
- Tests inclus dans la même PR que le code qu'ils couvrent.

## Corrections

- Les retours de review sont traités par nouveaux commits sur la même branche, pas par rebase forcé destructif sauf demande explicite.
- CI doit repasser verte après chaque correction.

## Notifications

- Le ticket GitHub lié est référencé dans la PR (ex. `Closes #58`) quand la PR clôt le ticket.

## Interdiction de merge automatique

**Aucune PR n'est mergée automatiquement, sous aucune condition** (CI verte, review approuvée, urgence perçue). Le merge est toujours une action humaine explicite, déclenchée par l'utilisateur ou une personne autorisée du projet. Claude Code ne merge jamais une PR de sa propre initiative.

## Notifications Discord

- Workflow `.github/workflows/discord-notify.yml` : envoie une notification Discord à l'ouverture, la mise à jour ou le merge d'une PR, sur demande de correction (review `changes_requested`), et au démarrage/succès/échec du workflow `CI`.
- Logique de formatage et d'envoi dans `src/lib/discordNotify.ts` (testée dans `discordNotify.test.ts`), invoquée en CI via `npm run notify:discord -- <type>` (`scripts/notify-discord.ts`).
- Le webhook Discord est stocké dans le secret GitHub Actions `DISCORD_WEBHOOK_URL` (Settings → Secrets and variables → Actions). Il n'apparaît jamais dans le code, les logs ou les issues.
- Chaque étape de notification est isolée (`continue-on-error: true`) : une panne Discord ou un webhook manquant n'affecte jamais le résultat de la CI.
- Déduplication : chaque événement GitHub (ouverture, synchronisation, merge, review, run CI) ne déclenche qu'un seul appel Discord correspondant, sans notification répétée pour le même événement.
- Rotation du webhook : régénérer l'URL depuis les paramètres du salon Discord (Intégrations → Webhooks), puis mettre à jour le secret `DISCORD_WEBHOOK_URL` dans les paramètres du dépôt GitHub. Aucune modification de code nécessaire.

## Protection des branches

- `master` : branch protection classique — check CI `Lint, typecheck, test, build` obligatoire, branche à jour requise (`strict`), 1 review humaine obligatoire, admins inclus, force-push et suppression interdits.
- En cas d'échec de la CI, le merge est bloqué au niveau GitHub, indépendamment de toute action de Claude Code.
