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

## Organisation du code (un dossier par module)

Chaque composant, écran, flow, hook ou module a son propre dossier, nommé comme lui, qui contient son code, son test et, pour l'UI, sa story :

```
src/features/chart/ChartProgressFlow/ChartProgressFlow.tsx
src/features/chart/ChartProgressFlow/ChartProgressFlow.test.tsx
src/features/chart/useMyChart/useMyChart.ts
src/features/chart/natalChart/natalChart.ts
src/shared/components/ui/Badge/Badge.{tsx,test.tsx,stories.tsx}
```

- `src/features/<domaine>/` (`auth`, `chart`, `discovery`, `onboarding`, `welcome`) regroupe flows, écrans, hooks et accès API d'un domaine. `src/shared/` regroupe le transverse (`components/ui`, `AppShell`, `cx`, `email`, `supabaseClient`, `useCooldown`, `navigation` : routes, gardes et écrans de route, voir `architecture.md` (Routage)). `src/i18n/` garde `format/`, `messages/<nom>/` et `resources/`.
- Un fichier d'aide (`getInitial.ts`, `icons.tsx`, fixtures) peut rester dans le dossier du module qui l'utilise ; s'il a son propre test, il a son propre dossier. Un dossier de catégorie (`features/chart/`, `shared/`) ne contient que des dossiers.
- Dossier racine `shared/` : TypeScript pur importé à la fois par Vite (`src/`) et Deno (`supabase/functions/`), imports relatifs avec extension `.ts`, sans dépendance à React ni au DOM. Il contient les signes du zodiaque (`zodiac/`), les calculs de temps (`time/utcOffset`, `time/legalMeanTime`), les contrats des Edge Functions (`contracts/`) et les types de la base (`database.types.ts`). Ses tests sont des tests Vitest (`*.test.ts`) à côté du code. Un calcul n'existe qu'une fois : jamais de copie entre `src/` et `supabase/functions/`.
- Le code de CI ne vit pas dans `src/` : `scripts/discordNotify/` pour la notification Discord.
- Vérification automatique : `npm run check:convention` (`scripts/checkModuleConvention/`), exécuté en CI. Sont ignorés : `src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`, `src/test/`, `src/docs/`, `src/i18n/locales/`, les `*.d.ts` et `shared/database.types.ts`.

## Tests

- Tout nouveau fichier de logique (hook, service, utilitaire) ou composant React significatif est accompagné de son test **dans la même pull request**. Pas de "je rajouterai les tests plus tard".
- Tests via React Testing Library pour les composants.
- Pas de mock de ce qui peut être testé en réel de façon fiable et rapide.

## Tests end-to-end (Playwright)

Tests de non-régression de bout en bout, dans `e2e/` (hors `src/`, ignoré par Vitest), config `playwright.config.ts`.

- `npm run test:e2e` (headless) et `npm run test:e2e:ui` (mode interactif). Prérequis : `supabase start` (Docker) et, dans un autre terminal, `supabase functions serve`. La config construit l'app (`npm run build`), la sert avec `vite preview` (port 4173) et lit l'URL et la clé publishable de la stack locale via `supabase status -o env` (ou `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` si déjà définies). Aucune donnée de production.
- Structure : `e2e/specs/*.spec.ts` (un fichier par domaine : `discovery-onboarding`, `navigation`, `discovery-mode`, `auth`) et `e2e/support/` (helpers : onboarding, quota, Mailpit, mock du géocodage).
- Chaque test part d'un contexte de navigateur neuf, donc d'une session anonyme neuve : les tests sont indépendants et parallélisables.
- Sélecteurs : par rôle accessible (`getByRole`) ou par `id` (`<composant>__<type>--<descriptor>`). Jamais de classe CSS ni de texte fragile. Un élément sans `id` utile en reçoit un dans le composant, en même temps que le test.
- Emails : la stack locale embarque Mailpit (`http://127.0.0.1:54324`, `MAILPIT_URL` pour surcharger) ; `e2e/support/mailpit.ts` y lit les messages, aucun email réel n'est envoyé. Utiliser `uniqueEmail()` pour éviter les collisions.
- Services tiers : le géocodage (Open-Meteo, via l'Edge Function `geocode`) est intercepté par `mockGeocode` pour rester déterministe ; le calcul du thème, le quota et l'auth passent par la vraie stack locale.
- **Règle : toute nouvelle fonctionnalité utilisateur ajoute ou étend un parcours E2E dans la même PR** (en plus des tests unitaires). Une correction de bug sur un parcours existant ajoute l'étape qui l'aurait détecté. Un parcours connu cassé se marque `test.fixme` avec la cause, jamais supprimé.
- En CI, le job `e2e` démarre Supabase, sert les Edge Functions et lance les specs ; en cas d'échec, `e2e/playwright-report` et `e2e/test-results` (traces, captures) sont publiés en artefact `playwright-report` (`npx playwright show-trace <trace.zip>`).

## Conventions de code

- TypeScript strict, pas de `any`.
- Composants : `PascalCase`. Hooks, fonctions, variables : `camelCase`.
- Props de composant typées via `interface Props`.
- `useEffect`/`useCallback`/`useMemo` : dependency arrays complètes et exactes.
- Pas de duplication évitable ; pas d'abstraction créée avant qu'un second usage réel existe.
- Pas de code mort.
- **Aucun commentaire dans le code, JSDoc compris** : ni `//`, ni `/* */`, ni `/** */`, ni `{/* */}`. Commentaires libres uniquement dans les fichiers de test (`*.test.ts(x)`, `src/test/**`). Le nom du code doit suffire ; un « pourquoi » non évident va dans la PR ou le `decision-log.md`. Seules les directives techniques sont tolérées (`/// <reference …>`, `eslint-disable…`, `@ts-expect-error`). S'applique aussi au code Deno de `supabase/functions/`. La règle ESLint locale `numa/no-comments` tolère encore les JSDoc de fonction exportée : elle sera durcie avec le retrait des commentaires existants (#134) ; en attendant, n'en ajouter aucun.
- Taille : fichier ≤ 300 lignes (ESLint `max-lines`, erreur), fonction ≤ 60 lignes et complexité ≤ 12 (avertissements, à résorber progressivement). `import type` obligatoire pour les imports de types.
- **Aucun `console.log`** dans le code poussé. Bloqué par ESLint (`no-console`).

## IDs HTML

Tout élément significatif (conteneur, titre, champ, bouton, lien, item de liste) porte un `id` stable, utilisé par les tests :

- Format `<composant>__<type>--<descriptor>` en kebab-case (ex. `app__main--root`, `login-form__input--email`).
- Items de liste : suffixe avec l'identifiant métier, jamais l'index (`conversation-list__item--${conversation.id}`).
- Chaque `<label>` est relié à son champ via `htmlFor`.

## Design system

- Tailwind CSS 4, configuration CSS-first : plugin Vite `@tailwindcss/vite` (pas de PostCSS ni de `tailwind.config.ts`). Les tokens de la maquette (couleurs, typographie, rayons, `max-w-app`) sont déclarés une seule fois dans le bloc `@theme` de `src/index.css`. `--color-*: initial` retire la palette Tailwind par défaut : seules les couleurs Numa existent. Aucune couleur en dur (`bg-[#…]`).
- Fichiers scannés : listés explicitement par `@source` dans `src/index.css` (`index.html`, `src/**/*.{ts,tsx,mdx}`, `.storybook/**/*.{ts,tsx}`). Un nouveau dossier contenant des classes doit y être ajouté.
- Nommage v4 : `rounded-sm` (4 px) et `rounded-xs` (2 px), `shadow-sm` (ombre légère), `outline-hidden` (et non `outline-none`) pour masquer l'outline au focus. `ring-*` s'accompagne toujours d'une couleur (`ring-violet/30`) : la couleur par défaut est `currentColor`. `hover:` s'applique à tout survol (variante redéfinie, comme en v3).
- Les écrans suivent la maquette Claude Design (`Astraia.dc.html`) ; chaque écran a son ticket `[Design]`. Correspondance écran → ticket → composants, états et responsive : `docs/design/handoff.md`.
- Composants réutilisables dans `src/shared/components/ui/<Composant>/` : `<Composant>.tsx`, `.test.tsx`, `.stories.tsx`. Avant de créer un élément d'interface, vérifier qu'un composant existant ne couvre pas le besoin.
- Styles partagés (anneau de focus, champs) dans `src/shared/components/ui/styles/styles.ts`.
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
  i18n.ts                  # init i18next (ressources embarquées, initAsync: false, fallbackLng "fr")
  resources/resources.ts   # langues supportées, namespaces, namespace par défaut
  i18next.d.ts             # typage strict des clés (CustomTypeOptions)
  format/format.ts         # formatNumber, formatPercent, formatDate (Intl)
  messages/<nom>/<nom>.ts  # traduction des codes renvoyés par les modules métier (onboarding, auth, questionQuota)
  locales/fr/
    index.ts               # assemble les namespaces ; type Translations
    common.json            # partagé : nom de l'app, actions génériques (Fermer, Retour, Envoyer)
    welcome.json           # écran d'accueil / découverte
    auth.json              # authentification, session anonyme
    ui.json                # libellés par défaut des composants src/shared/components/ui
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

- **Couche domaine (modules métier de `src/features/<domaine>/`)** : aucune phrase, ni traduite ni en dur. Elle renvoie des codes typés (`"save_failed"`, `{ code: "rate_limited", retryable }`…) ; le hook ou l'écran consommateur les traduit avec les fonctions de `src/i18n/messages/` (ex. `upgradeErrorMessage(code, t)`, `buildOnboardingSummary(data, t, i18n.language)`), clé construite par template literal pour que le typage couvre chaque code.
- Hors composant React, si un texte doit vraiment être produit : `import i18n from "../i18n"` puis `i18n.t("auth:anonymousSession.notCreated")`.
- **Typage strict** : une clé ou un namespace inexistant fait échouer `npm run typecheck` (`strictKeyChecks` activé, vérifié par `src/i18n/i18n.test.ts`).
- **Interpolation** : `"progress": "Étape {{step}} sur {{total}}"` puis `t("stepHeader.progress", { step, total })`. L'échappement HTML est désactivé (React échappe déjà).
- **Pluriels** : suffixes CLDR `_one` / `_other` (+ `_zero`, `_few`, `_many` selon la langue) et option `count` : `"questions_one": "{{count}} question restante"`, `"questions_other": "{{count}} questions restantes"` puis `t("questions", { count })`. En français, **0 et 1 sont au singulier** (`_one`).
- **Texte riche** (lien ou balise au milieu d'une phrase) : composant `<Trans>` de `react-i18next`, jamais de concaténation de fragments traduits.
- **Nombres et dates** : `formatNumber`, `formatPercent`, `formatDate` de `src/i18n/format/format.ts` avec la langue courante (`const { i18n } = useTranslation(); formatPercent(0.42, i18n.language)`), jamais de format codé en dur (`"42 %"`, `toLocaleDateString("fr-FR")`).

### Tests et Storybook

- `src/test/setup.ts` importe `src/i18n` : les tests RTL rendent les vrais textes français, à rechercher tels quels (`getByRole("button", { name: "Fermer" })`). Aucun wrapper ni mock nécessaire.
- `.storybook/preview.tsx` importe `src/i18n` : les stories affichent les textes traduits.

### Ajouter une langue (ex. anglais)

1. Créer `src/i18n/locales/en/` avec les mêmes fichiers JSON que `fr/`, et `locales/en/index.ts` : `export const en: Translations = { common, welcome, … };` (le type `Translations` impose les mêmes namespaces et les mêmes clés).
2. Ajouter `en` à `resources` dans `src/i18n/resources/resources.ts` (`{ fr, en }`).
3. Choisir la langue : `i18n.changeLanguage("en")` (sélecteur) ou détection (`i18next-browser-languagedetector`), à décider dans le ticket concerné ; mettre à jour l'attribut `lang` de `index.html` / `document.documentElement`.

## Storybook

- `npm run storybook` (port 6006) ; `npm run build-storybook` exécuté en CI.
- Tout nouveau composant de `src/shared/components/ui/` a une story par variante et par état (désactivé, chargement, erreur, vide…).
- Les pages « Fondations » (couleurs, typographie, rayons) sont dans `src/docs/` ; les couleurs y sont lues depuis le bloc `@theme` de `src/index.css` via `src/docs/themeTokens/themeTokens.ts` (import `?raw`).
- L'addon a11y signale les violations d'accessibilité de chaque story : à corriger avant PR.

## Couverture

La couverture (`npm run test:coverage`) est vérifiée sur toute PR ajoutant de la logique. Seuil initial : 70 % (lignes, statements, fonctions, branches), configuré dans `vite.config.ts` (`test.coverage.thresholds`). Voir `decision-log.md`.

## CI

- Workflow `.github/workflows/ci.yml`, quatre jobs :
  - `quality` : `npm audit --omit=dev --audit-level=high`, `npm run lint`, `npm run typecheck`, `npm run test:coverage`, `npm run build`, `npm run build-storybook`.
  - `e2e` : démarre Supabase local, sert les Edge Functions, installe Chromium et lance `npm run test:e2e` ; traces et captures en artefact en cas d'échec.
  - `edge-functions` : `deno fmt --check`, `deno lint`, `deno task check`, `deno task test` dans `supabase/functions`.
  - `supabase-migrations` : démarre Supabase local, applique les migrations (`supabase db reset`) puis vérifie que `shared/database.types.ts` correspond au schéma (`npm run types:generate`) puis exécute les tests pgTAP (`supabase test db`).
- Déclenchement : PR vers `master` et push sur `master` (couvre la CI post-merge).
- `master` est protégée côté GitHub (checks `quality` et `e2e` obligatoires, branche à jour, PR obligatoire ; aucune approbation exigée) — voir `pull-requests.md`.

## Audit des dépendances

- Étape bloquante du job `quality` : `npm audit --omit=dev --audit-level=high`. Une vulnérabilité haute ou critique dans une dépendance de production (code embarqué dans le bundle servi) fait échouer la CI.
- Les dépendances de développement (Vite, Vitest, Tailwind, Storybook…) ne bloquent pas la CI : lancer `npm audit` complet avant toute PR qui touche `package.json` et justifier les vulnérabilités restantes dans la PR ou `decision-log.md`.
- Corriger d'abord avec `npm audit fix` (sans `--force`). Une montée de version majeure se fait à la main, après lecture des notes de migration, jamais via `npm audit fix --force`.
