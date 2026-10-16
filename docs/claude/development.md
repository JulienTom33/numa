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
- **Aucun commentaire dans le code, JSDoc compris** : ni `//`, ni `/* */`, ni `/** */`, ni `{/* */}`. Commentaires libres uniquement dans les fichiers de test (`*.test.ts(x)`, `src/test/**`). Le nom du code doit suffire ; un « pourquoi » non évident va dans la PR ou le `decision-log.md`. Seules les directives techniques sont tolérées (`/// <reference …>`, `eslint-disable…`, `@ts-expect-error`). S'applique aussi au code Deno de `supabase/functions/`. La règle ESLint locale `numa/no-comments` tolère encore les JSDoc de fonction exportée : elle sera durcie avec le retrait des commentaires existants (#134) ; en attendant, n'en ajouter aucun.
- **Aucun `console.log`** dans le code poussé. Bloqué par ESLint (`no-console`).

## IDs HTML

Tout élément significatif (conteneur, titre, champ, bouton, lien, item de liste) porte un `id` stable, utilisé par les tests :

- Format `<composant>__<type>--<descriptor>` en kebab-case (ex. `app__main--root`, `login-form__input--email`).
- Items de liste : suffixe avec l'identifiant métier, jamais l'index (`conversation-list__item--${conversation.id}`).
- Chaque `<label>` est relié à son champ via `htmlFor`.

## Design system

- Les tokens de la maquette (couleurs, typographie, rayons) sont déclarés une seule fois dans `tailwind.config.ts`. `theme.colors` remplace la palette Tailwind par défaut : seules les couleurs Numa existent. Aucune couleur en dur (`bg-[#…]`).
- Les écrans suivent la maquette Claude Design (`Astraia.dc.html`) ; chaque écran a son ticket `[Design]`. Correspondance écran → ticket → composants, états et responsive : `docs/design/handoff.md`.
- Composants réutilisables dans `src/components/ui/<Composant>/` : `<Composant>.tsx`, `.test.tsx`, `.stories.tsx`. Avant de créer un élément d'interface, vérifier qu'un composant existant ne couvre pas le besoin.
- Styles partagés (anneau de focus, champs) dans `src/components/ui/styles.ts`.
- Chaque composant prend un `id` obligatoire fourni par l'écran appelant ; ses sous-éléments en dérivent leurs IDs (`${id}-hint`, `${id}-error`…).

## Internationalisation (i18n)

`i18next` + `react-i18next`. Français seul pour l'instant ; la structure accueille d'autres langues sans changement de code applicatif. Voir `decision-log.md` (2026-10-15, issue #118).

### Règles

- **Aucun texte affiché en dur** dans un composant, un hook ou une lib : tout texte visible ou lu par un lecteur d'écran (contenu JSX, `aria-label`, `placeholder`, `title`, `alt`, messages d'erreur affichés, libellés par défaut des composants UI) passe par `t()`.
- ESLint (`i18next/no-literal-string`, mode `jsx-text-only`) bloque le texte en dur dans le JSX sur `src/**`, hors tests, stories, `src/test/**` et `src/docs/**`. Les attributs (`aria-label`, `placeholder`…) et les chaînes hors JSX ne sont pas détectés : c'est à la relecture de les vérifier.
- Exceptions : tests, stories et pages `src/docs/` peuvent contenir du texte en dur ; les composants UI acceptent un libellé passé en prop (fourni traduit par l'écran appelant) et retombent sur une clé `ui` / `common` par défaut.

### Organisation

```
src/i18n/
  index.ts                 # init i18next (ressources embarquées, initAsync: false, fallbackLng "fr")
  resources.ts             # langues supportées, namespaces, namespace par défaut
  i18next.d.ts             # typage strict des clés (CustomTypeOptions)
  format.ts                # formatNumber, formatPercent, formatDate (Intl)
  messages/                # traduction des codes renvoyés par src/lib (onboarding, auth, questionQuota)
  locales/fr/
    index.ts               # assemble les namespaces ; type Translations
    common.json            # partagé : nom de l'app, actions génériques (Fermer, Retour, Envoyer)
    welcome.json           # écran d'accueil / découverte
    auth.json              # authentification, session anonyme
    ui.json                # libellés par défaut des composants src/components/ui
    astrology.json         # signes, placements (vocabulaire astrologique)
```

- **Un namespace par écran ou domaine** (`welcome`, `auth`, `onboarding`, `chat`…). Nouveau namespace : créer `locales/fr/<ns>.json` et l'ajouter à l'objet `fr` de `locales/fr/index.ts` (le typage et l'init le prennent en compte automatiquement).
- Ce qui sert à plusieurs écrans va dans `common` ; le vocabulaire astrologique dans `astrology`.

### Nommage des clés

- camelCase, hiérarchisées par bloc de l'écran : `<bloc>.<élément>` (ex. `discover.start`, `chat.inputPlaceholder`, `stepChecklist.status.done`).
- Clé décrivant le rôle, pas le texte (`discover.start`, pas `decouvrirSansCompte`).
- Valeurs d'énumération typées : clé construite par template literal (`` t(`signs.${sign}`) ``), le typage vérifie toutes les combinaisons.

### Utilisation

```tsx
const { t } = useTranslation("welcome");          // namespace de l'écran
t("discover.start");                               // clé du namespace
const { t } = useTranslation(["welcome", "common"]);
t("common:app.name");                              // autre namespace : préfixe `ns:`, déclaré dans useTranslation
```

- **Couche domaine (`src/lib/`)** : aucune phrase, ni traduite ni en dur. Elle renvoie des codes typés (`"save_failed"`, `{ code: "rate_limited", retryable }`…) ; le hook ou l'écran consommateur les traduit avec les fonctions de `src/i18n/messages/` (ex. `upgradeErrorMessage(code, t)`, `buildOnboardingSummary(data, t, i18n.language)`), clé construite par template literal pour que le typage couvre chaque code.
- Hors composant React, si un texte doit vraiment être produit : `import i18n from "../i18n"` puis `i18n.t("auth:anonymousSession.notCreated")`.
- **Typage strict** : une clé ou un namespace inexistant fait échouer `npm run typecheck` (`strictKeyChecks` activé, vérifié par `src/i18n/i18n.test.ts`).
- **Interpolation** : `"progress": "Étape {{step}} sur {{total}}"` puis `t("stepHeader.progress", { step, total })`. L'échappement HTML est désactivé (React échappe déjà).
- **Pluriels** : suffixes CLDR `_one` / `_other` (+ `_zero`, `_few`, `_many` selon la langue) et option `count` : `"questions_one": "{{count}} question restante"`, `"questions_other": "{{count}} questions restantes"` puis `t("questions", { count })`. En français, **0 et 1 sont au singulier** (`_one`).
- **Texte riche** (lien ou balise au milieu d'une phrase) : composant `<Trans>` de `react-i18next`, jamais de concaténation de fragments traduits.
- **Nombres et dates** : `formatNumber`, `formatPercent`, `formatDate` de `src/i18n/format.ts` avec la langue courante (`const { i18n } = useTranslation(); formatPercent(0.42, i18n.language)`), jamais de format codé en dur (`"42 %"`, `toLocaleDateString("fr-FR")`).

### Tests et Storybook

- `src/test/setup.ts` importe `src/i18n` : les tests RTL rendent les vrais textes français, à rechercher tels quels (`getByRole("button", { name: "Fermer" })`). Aucun wrapper ni mock nécessaire.
- `.storybook/preview.tsx` importe `src/i18n` : les stories affichent les textes traduits.

### Ajouter une langue (ex. anglais)

1. Créer `src/i18n/locales/en/` avec les mêmes fichiers JSON que `fr/`, et `locales/en/index.ts` : `export const en: Translations = { common, welcome, … };` (le type `Translations` impose les mêmes namespaces et les mêmes clés).
2. Ajouter `en` à `resources` dans `src/i18n/resources.ts` (`{ fr, en }`).
3. Choisir la langue : `i18n.changeLanguage("en")` (sélecteur) ou détection (`i18next-browser-languagedetector`), à décider dans le ticket concerné ; mettre à jour l'attribut `lang` de `index.html` / `document.documentElement`.

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
