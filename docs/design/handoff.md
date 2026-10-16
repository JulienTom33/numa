# Handoff design → développement

Document de passation entre la maquette et l'implémentation (issue #42). Il dit, pour chaque écran du MVP, quel ticket l'implémente, quels composants utiliser et quels états, comportements responsive et règles d'accessibilité respecter.

Sources de vérité, par ordre de priorité :

1. **Code du design system** : le bloc `@theme` de `src/index.css` (tokens), `src/components/ui/` (composants), Storybook (`npm run storybook`).
2. **Tickets `[Design]`** (#72 à #94, label `design`) : contenu et critères d'acceptation de chaque écran.
3. **Maquette** : voir ci-dessous.

En cas de divergence entre ce document et le code, le code fait foi et ce document est corrigé.

## Maquette de référence

- Outil : Claude Design.
- Projet : « App de voyance et astrologie ».
- Fichier : `Astraia.dc.html`.
- Format de conception : mobile, cadre 390 × 844 (#73).
- URL de partage, frames et screenshots : **pas encore disponibles**, voir [À fournir par le design](#à-fournir-par-le-design).

## Écrans du MVP

Chaque écran a un ticket `[Design]` (rendu conforme à la maquette) et un ou plusieurs tickets fonctionnels (logique et données). Le ticket `[Design]` porte le contenu détaillé et les critères d'acceptation : le lire avant d'implémenter.

| # | Écran | Ticket `[Design]` | Tickets fonctionnels | Composants principaux |
|---|---|---|---|---|
| 1 | Cadre d'app et barre d'onglets | #73 | — | `TabBar`, `TopBar`, `BottomSheet` (`aboveTabBar`) |
| 2 | Accueil et fiche « Qui est Numa ? » | #74 | #16 (landing, conçue) | `Logo`, `Button`, `TextLink`, `BottomSheet`, `DiscoverButton` |
| 3 | Inscription et connexion (Google, Apple, lien email) | #75 | #14, #15 | `TopBar`, `Button` (`ink`, `outline`, `soft`), `TextLink` |
| 4 | Connexion par lien magique (saisie, confirmation) | #76 | #14 | `TextField`, `Button`, `Callout` |
| 5 | Onboarding 1–2 : prénom, date de naissance | #77 | #18 | `TopBar`, `DiscoveryModeBadge`, `StepHeader`, `TextField`, `Select`, `Callout` (`success`), `Button` |
| 6 | Onboarding 3 : heure de naissance | #78 | #18 | `StepHeader`, `SelectableCardGroup`, `TextField`, `Callout` (`warning`), `Disclosure` |
| 7 | Onboarding 4 : lieu de naissance | #79 | #19 | `StepHeader`, `Autocomplete`, `Callout` (`info`) |
| 8 | Onboarding 5 : ascendant (calculé ou déclaré) | #80 | #18, #20 | `StepHeader`, `Callout` (`highlight`, `warning`), `SegmentedControl` ou `SelectableCardGroup` (Oui / Non), `SignGrid`, `TextLink`, `Button` |
| 9 | Calcul du thème (progression) | #81 | #20, #22 | `ProgressRing`, `StepChecklist`, `Callout` (`error`) |
| 10 | Résultat : profil astrologique et méthode | #82 | #21 | `PlanetTrio`, `Card`, `InfoTooltip`, `TextLink`, `Button` |
| 11 | Aujourd'hui (tableau de bord) | #83 | #23 | `TopBar`, `DiscoveryModeBadge`, `Avatar`, `Card` (`violet`, `coral`, `sky`, `gold`), `TextLink`, `TabBar` |
| 12 | Horoscope du jour | #84 | #24, #28 | `TopBar`, `SegmentedControl`, `Card`, `Disclosure`, `Callout` |
| 13 | Consulter : chat avec Numa | #85 | #25, #26, #28, #31 | `TopBar`, `Avatar`, `Badge`, `EmptyState`, `Chip`, `ChatBubble`, `ChatInput`, `BottomSheet` (historique), `ListRow`, `IconButton` |
| 14 | Mode découverte : limites, conversion, migration | #86 | #15, #27, #29 | `Callout` (`warning`), `BottomSheet`, `Button`, `ChatInput` (`disabled`) |
| 15 | Mon thème | #87 | #20, #21 | `PlanetTrio`, `Card`, `Disclosure`, `TabBar` |
| 16 | Profil et suppression des données | #88 | #30, #33 | `Avatar` (`showEditBadge`), `Badge` (`violet` / `sage`), `ListRow` (`danger`), `BottomSheet`, `Button` (`danger`), `TabBar` |
| 17 | Modifier mes informations et préférences | #89 | #30, #32 | `TextField`, `Select`, `Autocomplete`, `Callout` (`warning`), `Switch`, `Button` |
| 18 | Confiance : comment Numa construit ses lectures | #90 | #28, #45 | `TopBar`, `Card`, `StepChecklist` ou liste numérotée |

Tickets transverses : #72 (tokens et fondations), #93 (composants de base), #94 (composants composés) — tous livrés. #36 couvre le test responsive et accessibilité de l'ensemble.

La colonne « Composants principaux » est une correspondance proposée à partir des tickets `[Design]` ; elle est à confirmer frame par frame quand la maquette sera partagée.

## Composants du design system

Inventaire de `src/components/ui/` (un dossier par composant : `.tsx`, `.test.tsx`, `.stories.tsx`). Noms identiques dans le code et dans Storybook. Chaque composant prend un `id` obligatoire fourni par l'écran ; ses sous-éléments en dérivent leurs IDs (`${id}-error`…).

### Base (`Base/…` dans Storybook, #93)

| Composant | Variantes et options | États |
|---|---|---|
| `Avatar` | `size` : `sm`, `md`, `lg` ; `showEditBadge` ; cliquable si `onClick` | statique (`role="img"`) ou bouton |
| `Badge` | `tone` : `violet`, `sage`, `gold`, `sky`, `coral`, `neutral` | — |
| `Button` | `variant` : `primary` (corail), `ink`, `outline`, `soft` (violet doux), `danger` ; `size` : `md`, `sm` ; `fullWidth` ; `leadingIcon` | survol, focus, désactivé, chargement (`loading`, `loadingLabel`) |
| `Callout` | `tone` : `info` (ciel), `warning` (or), `success` (sauge), `error` (corail, `role="alert"`), `highlight` (violet) ; `title` optionnel | — |
| `Card` | `tone` : `white`, `surface`, `violet`, `sky`, `gold`, `sage`, `coral` ; `padding` : `none`, `md`, `lg` ; `as` : `div`, `section`, `article` | — |
| `Chip` | `selected` | survol, focus, sélectionné (`aria-pressed`), désactivé |
| `Disclosure` | `summary`, `defaultOpen` | ouvert / fermé (`aria-expanded`) |
| `Icon` | `name` : `close`, `back`, `check`, `info`, `send`, `plus`, `edit`, `warning`, `today`, `consult`, `theme`, `profile`, `trash`, `history` ; `size` | décoratif (`aria-hidden`) |
| `IconButton` | `variant` : `ghost`, `surface` ; `icon` ; `label` obligatoire | survol, focus, désactivé |
| `InfoTooltip` | `label` | ouvert / fermé, fermeture Échap |
| `Logo` | `size` : `md`, `lg` ; `showWordmark` ; mot-symbole cliquable (`onWordmarkClick`, ouvre une fiche) | — |
| `ProgressRing` | `value` (0–100), `size`, `strokeWidth` | progression (`role="progressbar"`) |
| `SegmentedControl` | `options`, `value` | sélection, navigation flèches / Début / Fin |
| `Select` | `options`, `placeholder`, `hideLabel` | erreur (`error`), désactivé |
| `Switch` | `description` | actif / inactif, désactivé |
| `TextField` | `hint`, `hideLabel` | erreur (`error`), désactivé |
| `TextLink` | `tone` : `violet`, `ink`, `coral` ; ancre (`href`) ou bouton (`onClick`) | survol, focus |

### Composés (`Composés/…` dans Storybook, #94)

| Composant | Variantes et options | États |
|---|---|---|
| `Autocomplete` | `minChars`, `noResultsText`, `loadingText` | saisie, chargement, suggestions, aucun résultat, erreur |
| `BottomSheet` | `title`, `footer`, `closeLabel`, `aboveTabBar` | ouvert / fermé ; fermeture bouton, Échap, clic sur le voile ; focus piégé |
| `ChatBubble` | `author` : `user`, `numa` ; `period` ; `why` (dépliant « Pourquoi cette réponse ? ») | en attente (`pending`) |
| `ChatInput` | `placeholder`, `sendLabel` | vide, saisi, désactivé ; Entrée pour envoyer |
| `EmptyState` | `icon`, `description`, `action` | — |
| `ListRow` | `tone` : `default`, `danger` ; `value` ; `icon` | survol, focus |
| `PlanetTrio` | `sun`, `moon`, `ascendant` (`null` → `unknownLabel`) | ascendant connu / inconnu |
| `SelectableCardGroup` | options avec `title`, `description`, `content` (contenu affiché quand la carte est choisie) | aucune sélection, sélection ; radiogroup clavier |
| `SignGrid` | grille 4 × 3 des 12 signes | aucune sélection, sélection |
| `StepChecklist` | `steps`, `completedCount` | par étape : `done`, `current`, `pending` |
| `StepHeader` | `step`, `total`, `title`, `subtitle` | — |
| `TabBar` | `items` (4 onglets), `activeKey` | onglet actif (`aria-current="page"`, point doré) |
| `TopBar` | `onBack`, `backLabel`, `title`, `leading`, `trailing` | avec / sans retour |

### Composants applicatifs (`App/…` dans Storybook)

- `DiscoverButton` (`src/components/`) : bouton « Découvrir sans compte » avec chargement et erreur.
- `DiscoveryModeBadge` (`src/components/`) : pastille « Mode découverte ».

Styles partagés (anneau de focus, champs) : `src/components/ui/styles.ts`.

Le détail de chaque variante et état est visible dans les stories ; ce tableau sert d'index, pas de spécification.

## Tokens

Les tokens sont déclarés **une seule fois** dans le bloc `@theme` de `src/index.css`. Ne pas recopier de valeur ailleurs : utiliser les classes Tailwind correspondantes. Valeurs et rendus dans Storybook, section « Fondations » :

- Couleurs : `src/docs/Couleurs.mdx` (lit directement le bloc `@theme` de `src/index.css`).
- Typographie : `src/docs/Typographie.mdx`.
- Rayons : `src/docs/Rayons.mdx`.

Noms des tokens disponibles (les valeurs sont dans le bloc `@theme` de `src/index.css`) :

| Famille | Tokens | Exemple de classe |
|---|---|---|
| Neutres | `page`, `surface`, `white`, `line` | `bg-page`, `border-line` |
| Encre | `ink`, `ink-secondary`, `ink-muted` | `text-ink-secondary` |
| Corail (action) | `coral`, `coral-hover`, `coral-disabled`, `coral-soft`, `coral-ink` | `bg-coral` |
| Violet (identité, sélection) | `violet`, `violet-ink`, `violet-soft`, `violet-wash` | `text-violet-ink` |
| Ciel (information, Lune) | `sky`, `sky-ink`, `sky-soft` | `bg-sky-soft` |
| Or (avertissement, Soleil) | `gold`, `gold-ink`, `gold-soft` | `text-gold-ink` |
| Sauge (succès, compte actif) | `sage`, `sage-ink`, `sage-soft` | `bg-sage-soft` |
| Voile | `overlay` | `bg-overlay` |
| Polices | `font-display` (Manrope), `font-sans` (Inter, défaut) | `font-display` |
| Tailles de texte | `text-tab`, `text-title-sm`, `text-title`, `text-title-lg` | `text-title` |
| Rayons | `rounded-field`, `rounded-button`, `rounded-card`, `rounded-sheet` | `rounded-card` |
| Largeur | `max-w-app` | `max-w-app` |

Règles :

- `theme.colors` remplace la palette Tailwind : aucune autre couleur n'existe. Aucune valeur en dur (`bg-[#…]`).
- Tout nouveau token passe par le bloc `@theme` de `src/index.css` et par la page « Fondations » concernée, dans le même ticket.
- Les tokens sont considérés définitifs pour le MVP sauf correction issue de la maquette finale (voir [À fournir par le design](#à-fournir-par-le-design)).

## États par écran

États à prévoir pour chaque écran, en plus de ceux portés par les composants. La liste reprend les tickets `[Design]` ; un état absent de la maquette est à confirmer par le design avant implémentation.

| Écran | États |
|---|---|
| Accueil (#74) | par défaut ; fiche « Qui est Numa ? » ouverte ; démarrage du mode découverte en cours ; erreur de démarrage |
| Inscription / connexion (#75) | par défaut ; authentification en cours ; erreur fournisseur ; retour vers l'accueil ou « Aujourd'hui » si mode découverte |
| Lien magique (#76) | saisie (bouton désactivé tant que l'email est invalide) ; erreur de format ; envoi en cours ; confirmation ; renvoi effectué ; renvoi limité |
| Onboarding 1–2 (#77) | vide (« Continuer » désactivé) ; rempli ; date impossible refusée ; date enregistrée (confirmation verte) |
| Onboarding 3 (#78) | aucun choix ; heure exacte ; heure approximative + précision ; heure inconnue + avertissement + dépliant |
| Onboarding 4 (#79) | vide ; moins de 2 caractères ; recherche en cours ; suggestions ; aucun résultat ; ville choisie (encart ciel + fuseau) ; erreur du service |
| Onboarding 5 (#80) | variante calculée ; variante déclarée Oui (grille, avertissement si écart) ; variante déclarée Non ; bouton désactivé tant que le choix est incomplet |
| Calcul du thème (#81) | progression ; terminé (redirection) ; erreur avec « Réessayer » |
| Résultat (#82) | heure exacte / approximative / inconnue (ascendant inconnu dans `PlanetTrio`) ; bulle (i) ouverte |
| Aujourd'hui (#83) | anonyme (pastille affichée) ; connecté (pastille masquée, avatar toujours à droite) ; chargement ; erreur |
| Horoscope (#84) | Hier / Aujourd'hui / Demain ; dépliant ouvert ; chargement ; erreur |
| Chat (#85) | vide (suggestions) ; conversation ; réponse en attente ; erreur d'envoi ; historique vide / rempli ; confirmation de suppression |
| Mode découverte (#86) | 2 lectures restantes ; 1 restante (bandeau doré) ; 0 restante (fiche de conversion, saisie remplacée) ; migration réussie |
| Mon thème (#87) | roue repliée / dépliée ; ascendant inconnu |
| Profil (#88) | mode découverte (badge violet) ; compte gratuit (badge sauge) ; confirmation de suppression ; suppression en cours |
| Modifier (#89) | non modifié ; modifié (avertissement de recalcul) ; enregistrement en cours ; erreur ; notifications actives / inactives |
| Confiance (#90) | état unique (contenu statique) |

## Comportements responsive

Ce qui est établi :

- La maquette est conçue en mobile, cadre 390 × 844 (#73).
- Le contenu de l'app est limité à une colonne de largeur `max-w-app` (390 px), centrée ; `TabBar` et `BottomSheet` respectent cette largeur.
- Plein écran sur mobile avec zones de sécurité : `TabBar` ajoute `env(safe-area-inset-bottom)` en bas ; la zone haute (encoche) reste à traiter dans le cadre d'app (#73).
- `TabBar` visible uniquement sur les 4 écrans principaux (Aujourd'hui, Consulter, Mon thème, Profil) ; les `BottomSheet` ouvertes depuis ces écrans utilisent `aboveTabBar` pour ne pas la masquer (#73).
- `BottomSheet` : hauteur maximale 85 % de l'écran, contenu défilant au-delà.
- Chaque changement d'écran ramène le défilement en haut (#73).
- Onboarding 2 : listes Jour / Mois / Année en largeurs relatives 1 / 1,4 / 1 (#77).
- Chat : bulles limitées à 85 % de la largeur ; défilement automatique vers le dernier message (#85).

Ce qui n'est pas défini par la maquette et reste à fournir : comportement tablette et desktop (colonne centrée seule, ou mise en page dédiée ?), et petits mobiles (< 360 px). Par défaut, tant que le design ne tranche pas : colonne mobile centrée sur fond `bg-page` à toutes les largeurs. Validation multi-appareils dans #36.

## Accessibilité

Règles déjà appliquées par les composants (ne pas les contourner dans les écrans) :

- Focus clavier visible sur tout élément interactif : anneau `focusRing` / `focusWithinRing` (`src/components/ui/styles.ts`).
- Chaque champ a un `<label>` relié par `htmlFor` ; erreurs et aides reliées par `aria-describedby`, `aria-invalid` en cas d'erreur. `hideLabel` masque visuellement le libellé sans le retirer.
- Bouton icône : `label` obligatoire (`aria-label`). Icônes décoratives en `aria-hidden`.
- Choix uniques en `radiogroup` navigable aux flèches (`SegmentedControl`, `SelectableCardGroup`, `SignGrid`).
- `Autocomplete` : motif combobox (`aria-expanded`, `aria-activedescendant`, flèches, Entrée, Échap) ; « aucun résultat » annoncé (`role="status"`).
- `BottomSheet` : `role="dialog"`, `aria-modal`, focus piégé, fermeture Échap.
- `Disclosure`, `InfoTooltip` : `aria-expanded` / `aria-controls`, ouverture au clavier.
- `TabBar` : onglet actif `aria-current="page"`.
- `ProgressRing` : `role="progressbar"` avec valeur.
- `Callout` d'erreur : `role="alert"`.
- Animations désactivées avec `prefers-reduced-motion` (`motion-reduce:`).

Règles à respecter dans les écrans :

- IDs stables `<composant>__<type>--<descriptor>` sur tout élément significatif ; items de liste suffixés par l'identifiant métier (voir `docs/claude/development.md`).
- Un seul `h1` par écran (le titre de l'écran), hiérarchie de titres sans saut de niveau.
- Nouvelles réponses du chat annoncées aux lecteurs d'écran (région `aria-live`, #85).
- Contrastes : le texte sur fond teinté utilise la variante `-ink` de la couleur (ex. `text-gold-ink` sur `bg-gold-soft`), jamais la couleur de base. L'addon a11y de Storybook signale les violations ; elles sont corrigées avant PR.
- Agrandissement du texte et tests lecteur d'écran : #36.

## Assets

Assets présents dans le code (aucun fichier image exporté à ce jour) :

- Logo : dessiné en SVG dans `Logo` (cercle violet, points corail et ciel, mot-symbole « Numa »).
- Icônes : SVG inline dans `src/components/ui/Icon/icons.tsx` (liste dans le tableau des composants).
- Polices : Manrope et Inter auto-hébergées via `@fontsource-variable` (aucun appel à Google Fonts).

Assets attendus du design : voir la section suivante.

## À fournir par le design

Éléments absents de ce dépôt et non accessibles depuis le développement. Ne pas les inventer : tant qu'ils manquent, le ticket `[Design]` et ce document font référence.

- [ ] URL de partage de la maquette Claude Design (`Astraia.dc.html`, projet « App de voyance et astrologie »).
- [ ] Référence de frame (nom ou lien) pour chacun des 18 écrans du tableau, et pour chaque variante (onboarding 5 calculé / déclaré, profil découverte / compte, états vides et d'erreur).
- [ ] Screenshots mobile (390 × 844) de chaque écran, à déposer dans `docs/design/screenshots/` ou à joindre au ticket `[Design]` correspondant.
- [ ] Screenshots ou consignes desktop et tablette (non couverts par la maquette mobile).
- [ ] États non dessinés à confirmer : chargement et erreur des écrans connectés aux API (#81, #83, #84, #85), renvoi limité du lien magique (#76), erreur du service de géocodage (#79).
- [ ] Flux de choix en cas d'écart entre ascendant calculé et déclaré (« à concevoir », #80).
- [ ] Clarification du libellé « Modifier mon thème » du profil : lecture ou édition (#88).
- [ ] Remplacement de la roue simplifiée par une vraie carte du ciel (#87) : maquette de la carte.
- [ ] Assets exportables : logo (SVG, déclinaisons), icône d'application et favicon, illustrations éventuelles (`EmptyState`, accueil), images de partage.
- [ ] Validation de la correspondance écran → composants proposée ci-dessus, et signalement de tout écart entre la maquette finale et les tokens du bloc `@theme` de `src/index.css`.

Quand un élément est fourni : cocher la case, ajouter le lien ou le fichier ici et dans le ticket `[Design]` concerné.
