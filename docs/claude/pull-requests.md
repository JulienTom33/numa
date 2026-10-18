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
2. Job `review` : Claude relit la PR avec les critères de `.claude/agents/pr-reviewer.md`, lus depuis la branche de base (une PR ne peut pas modifier son propre reviewer). Outils limités à la lecture ; aucun commentaire ni review n'est posté sur la PR, pour ne pas envoyer de mails. Sortie structurée : `score` (0 à 100), `blocking` (nombre de findings bloquants), `summary`. Le workflow plafonne le score à 79 s'il reste un bloquant et déduit le verdict : `ok` si score ≥ 80 (`APPROVAL_SCORE`) sans bloquant, `changes_requested` sinon.
3. Le workflow écrit la synthèse dans le résumé du run (`GITHUB_STEP_SUMMARY`), l'envoie dans Discord et pose le label `claude-review:ok` ou `claude-review:changes`. Il ne poste jamais de review ni de commentaire (donc aucun mail GitHub) et n'utilise jamais `APPROVE` ni `REQUEST_CHANGES`, pour ne jamais bloquer ni débloquer un merge.
4. Verdict `ok` → Discord « Review Claude OK » avec le score : PR prête pour review humaine.
5. Verdict `changes_requested` : le job `decide` autorise la correction si moins de 5 corrections (`MAX_FIX_ITERATIONS`) sont déjà faites et si le score progresse. Discord « correction automatique en cours », puis job `fix` : il enregistre l'itération (label `claude-fix-<n>-score-<score>`, posé **avant** la correction pour que le compteur tienne même si le run est annulé), puis Claude corrige (bloquants d'abord, un commit par correction, périmètre de la PR inchangé), valide (lint, typecheck, tests, build), commite et pousse sur la branche de la PR. Le push (fait avec le token de la GitHub App Claude) déclenche un nouveau `synchronize`, donc CI et review repartent : la boucle review ↔ correction continue jusqu'au score ≥ 80.
6. Limite de 5 corrections atteinte, score bloqué (nouveau score ≤ score précédent ≤ score d'avant, sur 2 tours consécutifs), review en échec ou correction sans commit poussé → Discord « Review Claude : intervention humaine requise ». La review continue de tourner sur les pushes suivants, sans correction automatique. Le merge reste humain, même à 100/100.

Garde-fous : `concurrency` par PR avec `cancel-in-progress` ; aucune exécution sur les PR de forks ni en brouillon ; `permissions: {}` au niveau du workflow puis permissions minimales par job ; seul le bot `claude` est autorisé à relancer la review (ses propres commits de correction) ; le job `fix` ne peut pousser que `HEAD` vers la branche de la PR (pas de force-push, pas de `gh api`, pas de merge) ; la GitHub App Claude ne peut pas modifier `.github/workflows/`. Les étapes Discord sont en `continue-on-error`. Ce workflow n'est pas un check requis : son échec ne bloque jamais le merge.

### Configuration (mainteneur)

1. Installer la GitHub App Claude sur le dépôt : <https://github.com/apps/claude> (ou `/install-github-app` depuis Claude Code). Elle fournit le token (via OIDC, `id-token: write`) qui pousse les corrections ; un push fait avec le `GITHUB_TOKEN` ne relancerait pas les workflows.
2. Créer **un** des deux secrets GitHub Actions (Settings → Secrets and variables → Actions) :
   - `ANTHROPIC_API_KEY` : clé API Anthropic (console.anthropic.com), facturation à l'usage ;
   - `CLAUDE_CODE_OAUTH_TOKEN` : token d'abonnement Claude Pro/Max généré par `claude setup-token`.
3. `DISCORD_WEBHOOK_URL` existe déjà (voir ci-dessous).

Sans secret Claude, le job `gate` affiche une notice et tout le reste est ignoré : la CI existante n'est pas affectée. Les labels `claude-review:*` sont créés automatiquement au premier passage.

Remettre le compteur à zéro : retirer les labels `claude-fix-*` de la PR.

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
