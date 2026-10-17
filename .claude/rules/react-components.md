---
paths:
  - "src/components/**"
  - "src/features/**"
  - "src/screens/**"
  - "src/hooks/**"
  - "src/navigation/**"
---

# Composants et hooks React

- Détails : `docs/claude/development.md` (conventions, IDs HTML, design system).
- Un composant = une responsabilité ; fichier ≲ 300 lignes, fonction ≲ 50 lignes. Au-delà, extraire un sous-composant ou un hook.
- `interface Props` explicite, aucun `any`, aucun `as` pour contourner un type.
- Dependency arrays complètes et exactes. Toute promesse est attendue ou gérée.
- Chargement de données, annulation et retry ne sont jamais réimplémentés dans un nouveau hook : réutiliser le mécanisme partagé existant.
- Aucun texte en dur : `t()` (clé dans `src/i18n/locales/fr/<namespace>.json`).
- Aucune couleur en dur : tokens Tailwind du bloc `@theme` de `src/index.css`.
- Tout élément significatif porte un `id` `<composant>__<type>--<descriptor>` ; items de liste suffixés par l'identifiant métier ; `<label>` relié par `htmlFor`.
- Réutiliser un composant de `src/components/ui/` avant d'en créer un ; un nouveau composant UI a `.tsx`, `.test.tsx` et une story par variante et par état.
- Aucun commentaire, JSDoc compris.
