---
paths:
  - "src/lib/**"
---

# Couche domaine (`src/lib/`)

- Détails : `docs/claude/development.md` (Internationalisation), `docs/claude/architecture.md`.
- Aucun import de React, de composant ou de hook : logique pure et services.
- Aucune phrase, traduite ou en dur : renvoyer des codes typés (`"save_failed"`, `{ code, retryable }`). La traduction se fait dans `src/i18n/messages/` ou dans l'écran consommateur.
- Fonctions qui ne lèvent pas pour les erreurs attendues : résultat typé `{ data, error }` ou union discriminée.
- Dépendances injectables (client Supabase, fetch, horloge) pour tester sans mock lourd.
- Pas de duplication avec `supabase/functions/` : un calcul partagé n'a qu'une implémentation.
- Chaque fichier de logique a son `*.test.ts` dans la même PR.
- Aucun commentaire, JSDoc compris.
