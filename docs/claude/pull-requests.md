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

## Review automatique Claude

Workflow `.github/workflows/claude-review.yml`, basé sur l'action officielle `anthropics/claude-code-action` (épinglée par SHA). Il relit chaque PR vers `master` **avant** la review humaine ; il ne la remplace pas.

### Flux

1. Ouverture, synchronisation, réouverture ou passage en « prête » d'une PR (hors brouillon, hors fork) → job `gate` : vérifie qu'un secret Claude existe et compte les corrections automatiques déjà faites sur la PR.
2. Job `review` : Claude relit la PR (correction, `CLAUDE.md` et `docs/claude/`, tests, sécurité, IDs HTML, aucun commentaire hors tests/config). Outils limités à la lecture (`Read`, `Grep`, `gh pr view`, `gh pr diff`) et aux commentaires inline. Le verdict est une sortie structurée JSON (`verdict` : `ok` | `changes_requested`, `summary`).
3. Le workflow publie la synthèse en review de type **commentaire** (jamais `APPROVE`, jamais `REQUEST_CHANGES`, pour ne jamais bloquer ni débloquer un merge) et pose le label `claude-review:ok` ou `claude-review:changes`.
4. Verdict `ok` → Discord « Review Claude OK : PR prête pour review humaine ».
5. Verdict `changes_requested` et moins de 3 corrections déjà faites → Discord « correction automatique en cours » puis job `fix` : il enregistre l'itération (commentaire marqué `<!-- claude-fix-iteration -->`, posté **avant** la correction pour que le compteur tienne même si le run est annulé), puis Claude corrige, valide (lint, typecheck, tests, build), commite et pousse sur la branche de la PR. Le push (fait avec le token de la GitHub App Claude) déclenche un nouveau `synchronize`, donc CI et review repartent.
6. Limite atteinte (3 corrections), review en échec ou correction sans commit poussé → Discord « Review Claude : intervention humaine requise ». La review continue de tourner sur les pushes suivants, sans correction automatique.

Garde-fous : `concurrency` par PR avec `cancel-in-progress` ; aucune exécution sur les PR de forks ni en brouillon ; `permissions: {}` au niveau du workflow puis permissions minimales par job ; seul le bot `claude` est autorisé à relancer la review (ses propres commits de correction) ; le job `fix` ne peut pousser que `HEAD` vers la branche de la PR (pas de force-push, pas de `gh api`, pas de merge) ; la GitHub App Claude ne peut pas modifier `.github/workflows/`. Les étapes Discord sont en `continue-on-error`. Ce workflow n'est pas un check requis : son échec ne bloque jamais le merge.

### Configuration (mainteneur)

1. Installer la GitHub App Claude sur le dépôt : <https://github.com/apps/claude> (ou `/install-github-app` depuis Claude Code). Elle fournit le token (via OIDC, `id-token: write`) qui publie les commentaires inline et pousse les corrections ; un push fait avec le `GITHUB_TOKEN` ne relancerait pas les workflows.
2. Créer **un** des deux secrets GitHub Actions (Settings → Secrets and variables → Actions) :
   - `ANTHROPIC_API_KEY` : clé API Anthropic (console.anthropic.com), facturation à l'usage ;
   - `CLAUDE_CODE_OAUTH_TOKEN` : token d'abonnement Claude Pro/Max généré par `claude setup-token`.
3. `DISCORD_WEBHOOK_URL` existe déjà (voir ci-dessous).

Sans secret Claude, le job `gate` affiche une notice et tout le reste est ignoré : la CI existante n'est pas affectée. Les labels `claude-review:*` sont créés automatiquement au premier passage.

Remettre le compteur à zéro : supprimer les commentaires `Correction automatique Claude n/3` de la PR.

## Notifications Discord

- Workflow `.github/workflows/discord-notify.yml` : envoie une notification Discord à l'ouverture, la mise à jour ou le merge d'une PR, sur demande de correction (review `changes_requested`), et au démarrage/succès/échec du workflow `CI`. Les notifications de la review automatique Claude (`claude_review_ok`, `claude_review_fixing`, `claude_review_human_needed`) sont envoyées par `claude-review.yml`.
- Logique de formatage et d'envoi dans `src/lib/discordNotify.ts` (testée dans `discordNotify.test.ts`), invoquée en CI via `npm run notify:discord -- <type>` (`scripts/notify-discord.ts`).
- Le webhook Discord est stocké dans le secret GitHub Actions `DISCORD_WEBHOOK_URL` (Settings → Secrets and variables → Actions). Il n'apparaît jamais dans le code, les logs ou les issues.
- Chaque étape de notification est isolée (`continue-on-error: true`) : une panne Discord ou un webhook manquant n'affecte jamais le résultat de la CI.
- Déduplication : chaque événement GitHub (ouverture, synchronisation, merge, review, run CI) ne déclenche qu'un seul appel Discord correspondant, sans notification répétée pour le même événement.
- Rotation du webhook : régénérer l'URL depuis les paramètres du salon Discord (Intégrations → Webhooks), puis mettre à jour le secret `DISCORD_WEBHOOK_URL` dans les paramètres du dépôt GitHub. Aucune modification de code nécessaire.

## Protection des branches

- `master` : branch protection classique — check CI `Lint, typecheck, test, build` obligatoire, branche à jour requise (`strict`), PR obligatoire avec **0 approbation requise** (projet à un seul mainteneur : GitHub interdit d'approuver sa propre PR), admins inclus, force-push et suppression interdits.
- En cas d'échec de la CI, le merge est bloqué au niveau GitHub, indépendamment de toute action de Claude Code.
