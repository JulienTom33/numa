# Workflow Git

## Structure des branches

```
master
 └── issue-<id>-<slug>
```

- `master` : branche stable, toujours déployable (chaque push déclenche le déploiement OVH).
- `issue-<id>-<slug>` : branche de travail d'un ticket unique, créée depuis `master` à jour. `<slug>` : titre du ticket court en kebab-case, sans accents (ex. `issue-72-design-system`).

Les epics (`type:epic`) servent à regrouper les tickets dans GitHub, pas à créer des branches d'intégration. Voir `decision-log.md` (2026-10-15).

## Règles

- Une branche de travail traite **un seul ticket**.
- Toute modification passe par une pull request vers `master` : jamais de commit direct sur `master`.
- **Aucun merge automatique**, quel que soit le contexte (CI verte, review approuvée, etc.). Voir `pull-requests.md`.
- La CI doit être verte avant tout merge. Aucune approbation n'est exigée : le mainteneur relit et merge lui-même, manuellement.

## Démarrer un ticket

```bash
git status                       # aucun changement non commité à embarquer
git switch master
git pull --ff-only origin master
git switch -c issue-<id>-<slug>
```

Si la branche existe déjà : `git switch issue-<id>-<slug>` puis `git pull`.

## Labels

| Famille | Valeurs | Usage |
|---|---|---|
| Type | `type:epic`, `type:feature`, `type:task`, `type:research` | Nature du ticket |
| Priorité | `priority:p0` (bloquant MVP), `priority:p1`, `priority:p2` | Ordre de traitement |
| Domaine | `area:frontend`, `area:backend`, `area:auth`, `area:supabase`, `area:astrology`, `area:ai`, `area:design`, `area:qa`, `area:security`, `area:product`, `area:research` | Périmètre technique |
| Maquette | `design` | Ticket `[Design]` : implémentation d'un écran de la maquette |

Le statut d'avancement (Backlog, en cours, en review…) est suivi dans le GitHub Project « Sidéra », pas par labels.

## Statuts de PR

- PR ouverte : travail en cours ou prêt pour review.
- PR en review : attend la relecture du mainteneur.
- PR approuvée + CI verte : prête à merger — merge reste une action humaine explicite.
