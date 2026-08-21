# Workflow Git

## Structure des branches

```
master
 └── epic/<slug>/main
      └── epic/<slug>/issue-<id>-<slug>
```

- `master` : branche stable, toujours déployable.
- `epic/<slug>/main` : branche d'intégration d'une epic. Reçoit les PRs des tickets de l'epic.
- `epic/<slug>/issue-<id>-<slug>` : branche de travail d'un ticket unique. Créée depuis `epic/<slug>/main` (ou `master` si pas d'epic active).

## Règles

- Une branche de travail traite **un seul ticket**.
- Toute modification passe par une pull request : jamais de commit direct sur `master` ou `epic/<slug>/main`.
- **Aucun merge automatique**, quel que soit le contexte (CI verte, review approuvée, etc.). Voir `pull-requests.md`.
- La CI doit être verte et une revue humaine obtenue avant tout merge.
- Une PR de ticket cible `epic/<slug>/main` (ou `master` si le ticket n'appartient pas à une epic).
- Une PR d'epic (`epic/<slug>/main` → `master`) est ouverte une fois l'epic complète.

## Statuts

- PR ouverte : travail en cours ou prêt pour review.
- PR en review : attend une revue humaine.
- PR approuvée + CI verte : prête à merger — merge reste une action humaine explicite.
