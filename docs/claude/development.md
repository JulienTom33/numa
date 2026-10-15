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
- **Aucun `console.log`, aucun commentaire `TODO`/`FIXME`/`XXX` dans le code poussé** (sauf commentaire "pourquoi" ci-dessus). Bloqué par ESLint (`no-console`, `no-warning-comments`) dans `npm run lint`.
- Exception : commentaires libres autorisés dans les fichiers de test (`*.test.ts(x)`, `src/test/**`) et fichiers de config (`*.config.ts`, `*.config.js`, `.env*`, `package.json`, etc.) — `no-warning-comments` désactivé sur ces fichiers dans `eslint.config.js`.

## IDs HTML

Tout élément significatif (conteneur, titre, champ, bouton, lien, item de liste) porte un `id` stable, utilisé par les tests :

- Format `<composant>__<type>--<descriptor>` en kebab-case (ex. `app__main--root`, `login-form__input--email`).
- Items de liste : suffixe avec l'identifiant métier, jamais l'index (`conversation-list__item--${conversation.id}`).
- Chaque `<label>` est relié à son champ via `htmlFor`.

## Design system

- Les tokens de la maquette (couleurs, typographie, rayons) sont déclarés une seule fois dans `tailwind.config.ts` ; aucune couleur en dur dans les composants (pas de `bg-[#…]`).
- Les écrans suivent la maquette Claude Design (`Astraia.dc.html`) ; chaque écran a son ticket `[Design]`.

## Couverture

La couverture (`npm run test:coverage`) est vérifiée sur toute PR ajoutant de la logique. Seuil initial : 70 % (lignes, statements, fonctions, branches), configuré dans `vite.config.ts` (`test.coverage.thresholds`). Voir `decision-log.md`.

## CI

- Workflow `.github/workflows/ci.yml`, deux jobs :
  - `quality` : `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`.
  - `supabase-migrations` : démarre Supabase local, applique les migrations (`supabase db reset`) puis exécute les tests pgTAP (`supabase test db`).
- Déclenchement : PR vers `master` et push sur `master` (couvre la CI post-merge).
- `master` est protégée côté GitHub (check `quality` obligatoire, branche à jour, 1 review humaine) — voir `pull-requests.md`.
