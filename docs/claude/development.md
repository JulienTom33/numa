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
- Pas de code mort.
- **Aucun commentaire dans le code, uniquement dans les fichiers de test** (`*.test.ts(x)`, `src/test/**`). Le nom du code doit suffire ; un « pourquoi » non évident va dans la PR, le `decision-log.md` ou un test. Seules les directives techniques sont tolérées (`/// <reference …>`, `eslint-disable…`, `@ts-expect-error`). Bloqué par la règle ESLint locale `numa/no-comments` dans `npm run lint` ; s'applique aussi au code Deno de `supabase/functions/` (hors ESLint, vérifié en review).
- **Aucun `console.log`** dans le code poussé. Bloqué par ESLint (`no-console`).

## IDs HTML

Tout élément significatif (conteneur, titre, champ, bouton, lien, item de liste) porte un `id` stable, utilisé par les tests :

- Format `<composant>__<type>--<descriptor>` en kebab-case (ex. `app__main--root`, `login-form__input--email`).
- Items de liste : suffixe avec l'identifiant métier, jamais l'index (`conversation-list__item--${conversation.id}`).
- Chaque `<label>` est relié à son champ via `htmlFor`.

## Design system

- Les tokens de la maquette (couleurs, typographie, rayons) sont déclarés une seule fois dans `tailwind.config.ts`. `theme.colors` remplace la palette Tailwind par défaut : seules les couleurs Numa existent. Aucune couleur en dur (`bg-[#…]`).
- Les écrans suivent la maquette Claude Design (`Astraia.dc.html`) ; chaque écran a son ticket `[Design]`.
- Composants réutilisables dans `src/components/ui/<Composant>/` : `<Composant>.tsx`, `.test.tsx`, `.stories.tsx`. Avant de créer un élément d'interface, vérifier qu'un composant existant ne couvre pas le besoin.
- Styles partagés (anneau de focus, champs) dans `src/components/ui/styles.ts`.
- Chaque composant prend un `id` obligatoire fourni par l'écran appelant ; ses sous-éléments en dérivent leurs IDs (`${id}-hint`, `${id}-error`…).

## Storybook

- `npm run storybook` (port 6006) ; `npm run build-storybook` exécuté en CI.
- Tout nouveau composant de `src/components/ui/` a une story par variante et par état (désactivé, chargement, erreur, vide…).
- Les pages « Fondations » (couleurs, typographie, rayons) sont dans `src/docs/` ; les couleurs y sont lues depuis `tailwind.config.ts`.
- L'addon a11y signale les violations d'accessibilité de chaque story : à corriger avant PR.

## Couverture

La couverture (`npm run test:coverage`) est vérifiée sur toute PR ajoutant de la logique. Seuil initial : 70 % (lignes, statements, fonctions, branches), configuré dans `vite.config.ts` (`test.coverage.thresholds`). Voir `decision-log.md`.

## CI

- Workflow `.github/workflows/ci.yml`, deux jobs :
  - `quality` : `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`.
  - `supabase-migrations` : démarre Supabase local, applique les migrations (`supabase db reset`) puis exécute les tests pgTAP (`supabase test db`).
- Déclenchement : PR vers `master` et push sur `master` (couvre la CI post-merge).
- `master` est protégée côté GitHub (check `quality` obligatoire, branche à jour, PR obligatoire ; aucune approbation exigée) — voir `pull-requests.md`.
