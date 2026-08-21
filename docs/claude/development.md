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
- **Aucun `console.log`, aucun commentaire `TODO`/`FIXME`, aucun commentaire dans le code poussé** (sauf commentaire "pourquoi" ci-dessus). Bloqué par ESLint (`no-console`, `no-warning-comments`) dans `npm run lint`.

## Couverture

La couverture (`npm run test:coverage`) est vérifiée sur toute PR ajoutant de la logique. Seuil initial : 70 % (lignes, statements, fonctions, branches), configuré dans `vite.config.ts` (`test.coverage.thresholds`). Voir `decision-log.md`.

## CI

- Workflow `.github/workflows/ci.yml`, deux jobs :
  - `quality` : `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`.
  - `supabase-migrations` : si `supabase/migrations` existe, démarre Supabase local et exécute `supabase db reset` pour valider les migrations ; sinon l'étape est ignorée (pas encore de schéma Supabase dans le dépôt).
- Déclenchement : PR vers `master` et `epic/*/main`, et push sur ces branches (couvre la CI post-merge).
- `master` et `epic/*/main` sont protégées côté GitHub (check `quality` obligatoire, branche à jour, 1 review humaine) — voir `pull-requests.md`.
