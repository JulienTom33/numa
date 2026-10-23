# Orchestration d'agents

Traiter plusieurs tickets en une session, sans consommation excessive de tokens et sans conflit de fichiers.

## Rôles

| Rôle | Où | Modèle | Effort |
|---|---|---|---|
| Orchestrateur | skill `/orchestrate` (`.claude/skills/orchestrate/`) | Opus | medium |
| Worker | agent `ticket-worker` (`.claude/agents/ticket-worker.md`) | Sonnet | medium |
| Reviewer | agent `pr-reviewer` (`.claude/agents/pr-reviewer.md`), en local via `/review-pr` | Sonnet | medium |
| Reviewers spécialisés | agents `reviewer-ui-ux` et `reviewer-editorial`, selon les chemins du diff (`pull-requests.md`, « Reviewers spécialisés ») | Sonnet / Opus | medium |

Lancer : `claude --model opus`, `/effort medium`, puis `/orchestrate 12 15 18`.

## Coordination par fichiers

1. L'orchestrateur établit pour chaque ticket la liste de ses `claims` (fichiers/dossiers modifiables).
2. Deux tickets sont en conflit s'ils partagent un claim ou si l'un dépend de l'autre. Fichiers chauds en conflit systématique : `src/App.tsx`, `docs/claude/decision-log.md`, `src/i18n/locales/fr/*.json` partagés, `package.json`, `package-lock.json`, routes et configuration.
3. Les tickets sans conflit forment une vague de 5 workers maximum, lancés en parallèle, chacun dans son worktree.
4. Un worker ne modifie que ses `claims`. S'il lui faut un autre fichier, il rapporte `BESOIN: <fichier>` sans y toucher ; l'orchestrateur intègre ensuite séquentiellement.
5. Un ticket qui déplace ou renomme des fichiers passe seul.

## Budget

- 5 workers simultanés, 8 tickets et 2 vagues par exécution.
- Validation locale des workers : lint, typecheck, tests ciblés. Build, Storybook et couverture sont laissés à la CI.
- Rapports de workers : 5 lignes maximum. Deux échecs d'un worker : arrêt et décision humaine.
- Merges par lot, mise à jour des branches une seule fois après le lot. `/clear` entre deux lots.

## Boucle de review

1. Le worker ouvre la PR (`Closes #<id>`), le ticket passe en « In review ».
2. La CI (`claude-review.yml`) fait relire la PR par Claude avec les critères de `pr-reviewer.md` et attribue un score de 0 à 100.
3. Score ≥ 80 sans finding bloquant : label `claude-review:ok`, la PR attend la review humaine.
4. Sinon, un job de correction applique les findings et pousse ; la review repart. Le nombre de tours est borné et la boucle s'arrête si le score ne progresse pas.
5. Le merge reste une action humaine, même à 100 / 100.

Avant d'ouvrir la PR, `/review-pr` fait passer le même reviewer en local pour éviter un tour de CI, avec les reviewers spécialisés applicables. Dans `/orchestrate`, ces derniers sont lancés par l'orchestrateur après la vague (un worker ne peut pas lancer de sous-agent), avec au plus une relance du worker en mode correction.

## Garde-fous techniques (`.claude/settings.json`)

- Hook `PreToolUse` Bash : bloque le merge de PR en ligne de commande, le force-push, le push sur `master`, `git reset --hard` et `npm audit fix --force`. Le test porte sur le texte de la commande : un heredoc qui cite ces commandes est bloqué aussi, écrire alors le fichier avec l'outil d'écriture.
- Hook `PreToolUse` Edit/Write : bloque les fichiers de secrets et `.github/workflows/` (sauf `CLAUDE_ALLOW_WORKFLOW_EDIT=1`, sur demande explicite).
- Hook `PostToolUse` Edit/Write : `eslint --fix` sur le fichier TypeScript modifié ; une erreur est renvoyée à l'agent.
- Règles par chemin : `.claude/rules/*.md`, chargées uniquement quand les fichiers concernés sont touchés.
