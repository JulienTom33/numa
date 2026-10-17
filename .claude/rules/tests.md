---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "src/test/**"
  - "e2e/**"
---

# Tests

- Référence : `docs/claude/development.md` (Tests).
- React Testing Library : requêtes par rôle et nom accessible d'abord, `id` ensuite ; vrais textes français (i18n chargé par `src/test/setup.ts`).
- Tester un comportement observable, pas l'implémentation. Pas de mock de ce qui se teste en réel de façon fiable.
- Pas de `any`, pas de `.only`, pas de `.skip` sans ticket cité.
- Un test déterministe : pas de dépendance à l'heure, au hasard ou au réseau sans injection.
- Les commentaires sont autorisés dans les fichiers de test, uniquement pour le pourquoi.
