# Développement

## Commandes de validation

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
```

Ces commandes doivent passer avant de considérer une tâche terminée ou une PR prête pour review.

## Tests

- Tout nouveau fichier de logique (hook, service, utilitaire) ou composant React significatif est accompagné de son test **dans la même pull request**. Pas de "je rajouterai les tests plus tard".
- Tests via React Testing Library pour les composants.
- Pas de mock de ce qui peut être testé en réel de façon fiable et rapide.

## Conventions de code

- TypeScript strict, pas de `any`.
- Composants : `PascalCase`. Hooks, fonctions, variables : `camelCase`.
- Props de composant typées via `interface Props`.
- `useEffect`/`useCallback`/`useMemo` : dependency arrays complètes et exactes.
- Pas de duplication évitable ; pas d'abstraction créée avant qu'un second usage réel existe.
- Pas de code mort, pas de commentaire expliquant le "quoi" (le nom du code doit suffire) — commentaire seulement si le "pourquoi" est non évident.

## Couverture

La couverture (`npm run test:coverage`) est vérifiée sur toute PR ajoutant de la logique. Pas de seuil arbitraire fixé ici — voir `decision-log.md` si un seuil est décidé plus tard.
